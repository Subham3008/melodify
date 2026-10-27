import mongoose from "mongoose";

import { Track } from "./track.model.js";
import { fetchJamendoTracks } from "./jamendo.service.js";
import { ApiError } from "../../utils/ApiError.js";
import { getCloudFrontMediaUrl } from "./cloudfront-media.service.js";

import type { NormalizedTrack, TrackDTO } from "./track.types.js";

/*
|--------------------------------------------------------------------------
| Inputs
|--------------------------------------------------------------------------
*/

interface DiscoverTracksInput {
  limit?: number;
  offset?: number;
  search?: string;
  artistId?: string;
  albumId?: string;

  /*
  |--------------------------------------------------------------------------
  | Discover visibility
  |--------------------------------------------------------------------------
  |
  | true
  | → normal Discover Music catalog
  |
  | false
  | → recommendation/search/artist/album fetched track
  |   MongoDB me rahega but Discover Music me nahi dikhega
  |
  */

  isDiscoverable?: boolean;
}

interface GetTracksInput {
  search?: string;
  page?: number;
  limit?: number;
}

/*
|--------------------------------------------------------------------------
| Track document type
|--------------------------------------------------------------------------
*/

type TrackDocument = InstanceType<typeof Track>;

/*
|--------------------------------------------------------------------------
| Map MongoDB Track -> API DTO
|--------------------------------------------------------------------------
|
| Jamendo track:
| → existing imageUrl and streamUrl return as-is.
| → hlsUrl = null.
|
| S3 track:
| → audioStorageKey becomes CloudFront streamUrl.
| → imageStorageKey becomes CloudFront imageUrl.
|
| HLS:
| → only exposed when processingStatus === "ready".
| → hlsMasterStorageKey becomes CloudFront hlsUrl.
|
| External cover URL:
| → if imageStorageKey is null, existing imageUrl remains untouched.
|
*/

const mapTrackToDTO = (track: TrackDocument): TrackDTO => {
  let imageUrl = track.imageUrl;

  let streamUrl = track.streamUrl;

  let hlsUrl: string | null = null;

  /*
  |--------------------------------------------------------------------------
  | S3 hosted track
  |--------------------------------------------------------------------------
  */

  if (track.source === "s3") {
    /*
    |--------------------------------------------------------------------------
    | Original audio
    |--------------------------------------------------------------------------
    |
    | Keep this even after HLS is ready.
    |
    | It acts as fallback playback if HLS fails or browser does not support it.
    |
    */

    if (track.audioStorageKey) {
      streamUrl = getCloudFrontMediaUrl(track.audioStorageKey);
    }

    /*
    |--------------------------------------------------------------------------
    | Cover
    |--------------------------------------------------------------------------
    |
    | Uploaded cover:
    | imageStorageKey exists
    | → CloudFront URL
    |
    | External cover URL:
    | imageStorageKey is null
    | → existing imageUrl stays unchanged
    |
    */

    if (track.imageStorageKey) {
      imageUrl = getCloudFrontMediaUrl(track.imageStorageKey);
    }

    /*
    |--------------------------------------------------------------------------
    | Adaptive HLS stream
    |--------------------------------------------------------------------------
    |
    | HLS URL should only be returned when processing finished successfully.
    |
    | uploaded / processing / failed
    | → hlsUrl = null
    |
    | ready + hlsMasterStorageKey
    | → CloudFront master.m3u8 URL
    |
    */

    if (track.processingStatus === "ready" && track.hlsMasterStorageKey) {
      hlsUrl = getCloudFrontMediaUrl(track.hlsMasterStorageKey);
    }
  }

  return {
    id: String(track._id),

    source: track.source,

    externalId: track.externalId,

    title: track.title,

    artistId: track.artistId,

    artistName: track.artistName,

    albumId: track.albumId,

    albumName: track.albumName,

    durationSeconds: track.durationSeconds,

    imageUrl,

    streamUrl,

    hlsUrl,

    licenseUrl: track.licenseUrl,

    downloadAllowed: track.downloadAllowed,
  };
};

/*
|--------------------------------------------------------------------------
| Map multiple tracks
|--------------------------------------------------------------------------
*/

const mapTracksToDTO = (tracks: TrackDocument[]): TrackDTO[] => {
  return tracks.map(mapTrackToDTO);
};

/*
|--------------------------------------------------------------------------
| Save / upsert Jamendo tracks
|--------------------------------------------------------------------------
*/

const saveTracks = async (
  tracks: NormalizedTrack[],
  isDiscoverable = true,
): Promise<void> => {
  if (tracks.length === 0) {
    return;
  }

  const now = new Date();

  const operations = tracks.map((track) => {
    const commonFields = {
      ...track,

      lastSyncedAt: now,
    };

    /*
        |--------------------------------------------------------------------------
        | Normal Discover fetch
        |--------------------------------------------------------------------------
        |
        | Existing/new track becomes Discover Music eligible.
        |
        */

    if (isDiscoverable) {
      return {
        updateOne: {
          filter: {
            source: track.source,

            externalId: track.externalId,
          },

          update: {
            $set: {
              ...commonFields,

              isDiscoverable: true,
            },
          },

          upsert: true,
        },
      };
    }

    /*
        |--------------------------------------------------------------------------
        | Non-Discover fetch
        |--------------------------------------------------------------------------
        |
        | Used by:
        |
        | - recommendations
        | - Because You Listened To
        | - search fallback
        | - artist page
        | - album page
        |
        | Existing isDiscoverable=true track must stay true.
        |
        | false is only set for a brand-new inserted track.
        |
        */

    return {
      updateOne: {
        filter: {
          source: track.source,

          externalId: track.externalId,
        },

        update: {
          $set: {
            ...commonFields,
          },

          $setOnInsert: {
            isDiscoverable: false,
          },
        },

        upsert: true,
      },
    };
  });

  await Track.bulkWrite(operations);
};

/*
|--------------------------------------------------------------------------
| Fetch from Jamendo and save in MongoDB
|--------------------------------------------------------------------------
*/

export const discoverTracks = async (
  input: DiscoverTracksInput,
): Promise<TrackDTO[]> => {
  /*
  |--------------------------------------------------------------------------
  | Separate local DB flag from source-specific options
  |--------------------------------------------------------------------------
  */

  const { isDiscoverable = true, artistId, albumId, ...restInput } = input;

  /*
  |--------------------------------------------------------------------------
  | INTERNAL S3 ARTIST
  |--------------------------------------------------------------------------
  |
  | Internal artist IDs look like:
  |
  | internal-artist-arijit-singh
  |
  | These are NOT Jamendo IDs.
  |
  | Therefore never send them to Jamendo.
  |
  */

  if (artistId?.startsWith("internal-artist-")) {
    const query: Record<string, unknown> = {
      source: "s3",

      artistId,

      /*
      |--------------------------------------------------------------------------
      | User-facing artist page should only expose visible ready tracks
      |--------------------------------------------------------------------------
      */

      processingStatus: "ready",

      isDiscoverable: true,
    };

    /*
    |--------------------------------------------------------------------------
    | Optional album filter
    |--------------------------------------------------------------------------
    */

    if (albumId) {
      query.albumId = albumId;
    }

    const tracks = await Track.find(query)
      .sort({
        createdAt: -1,
      })
      .limit(input.limit ?? 50);

    return tracks.map(mapTrackToDTO);
  }

  /*
  |--------------------------------------------------------------------------
  | JAMENDO FLOW
  |--------------------------------------------------------------------------
  */

  const jamendoInput = {
    ...restInput,

    ...(artistId
      ? {
          artistId,
        }
      : {}),

    ...(albumId
      ? {
          albumId,
        }
      : {}),
  };

  const jamendoTracks = await fetchJamendoTracks(jamendoInput);

  /*
  |--------------------------------------------------------------------------
  | Persist Jamendo tracks
  |--------------------------------------------------------------------------
  */

  await saveTracks(jamendoTracks, isDiscoverable);

  const externalIds = jamendoTracks.map((track) => track.externalId);

  if (externalIds.length === 0) {
    return [];
  }

  const storedTracks = await Track.find({
    source: "jamendo",

    externalId: {
      $in: externalIds,
    },
  });

  /*
  |--------------------------------------------------------------------------
  | Preserve Jamendo response order
  |--------------------------------------------------------------------------
  */

  const trackMap = new Map(
    storedTracks.map((track) => [track.externalId, track]),
  );

  return jamendoTracks
    .map((track) => trackMap.get(track.externalId))
    .filter((track): track is NonNullable<typeof track> => Boolean(track))
    .map(mapTrackToDTO);
};

/*
|--------------------------------------------------------------------------
| Get catalog / search tracks
|--------------------------------------------------------------------------
*/

export const getTracks = async ({
  search,

  page = 1,

  limit = 20,
}: GetTracksInput): Promise<TrackDTO[]> => {
  const safePage = Math.max(page, 1);

  const safeLimit = Math.min(
    Math.max(limit, 1),

    50,
  );

  const skip = (safePage - 1) * safeLimit;

  const normalizedSearch = search?.trim() || "";

  const query: Record<string, unknown> = {};

  /*
    |--------------------------------------------------------------------------
    | Search mode
    |--------------------------------------------------------------------------
    |
    | Search intentionally includes non-discoverable DB tracks too.
    |
    */

  if (normalizedSearch) {
    const escapedSearch = normalizedSearch.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&",
    );

    const regex = new RegExp(escapedSearch, "i");

    query.$or = [
      {
        title: regex,
      },

      {
        artistName: regex,
      },

      {
        albumName: regex,
      },
    ];
  } else {
    /*
      |--------------------------------------------------------------------------
      | Normal Discover Music
      |--------------------------------------------------------------------------
      |
      | Both Jamendo and S3 tracks can appear here
      | when isDiscoverable=true.
      |
      */

    query.isDiscoverable = true;
  }

  /*
    |--------------------------------------------------------------------------
    | First query MongoDB
    |--------------------------------------------------------------------------
    */

  const tracks = await Track.find(query)
    .sort({
      createdAt: -1,
    })
    .skip(skip)
    .limit(safeLimit);

  /*
    |--------------------------------------------------------------------------
    | MongoDB result found
    |--------------------------------------------------------------------------
    */

  if (tracks.length > 0) {
    return mapTracksToDTO(tracks);
  }

  /*
    |--------------------------------------------------------------------------
    | Normal Discover fallback
    |--------------------------------------------------------------------------
    |
    | If DB has no discoverable tracks,
    | fetch popular tracks from Jamendo.
    |
    */

  if (!normalizedSearch) {
    return discoverTracks({
      limit: safeLimit,

      offset: skip,

      isDiscoverable: true,
    });
  }

  /*
    |--------------------------------------------------------------------------
    | Search fallback
    |--------------------------------------------------------------------------
    |
    | Search wasn't found in MongoDB.
    |
    | Ask Jamendo.
    |
    | Search results must NOT automatically
    | become part of normal Discover Music.
    |
    */

  return discoverTracks({
    search: normalizedSearch,

    limit: safeLimit,

    offset: skip,

    isDiscoverable: false,
  });
};

/*
|--------------------------------------------------------------------------
| Get single track
|--------------------------------------------------------------------------
*/

export const getTrackById = async (trackId: string): Promise<TrackDTO> => {
  if (!mongoose.isValidObjectId(trackId)) {
    throw new ApiError(400, "Invalid track id");
  }

  const track = await Track.findById(trackId);

  if (!track) {
    throw new ApiError(404, "Track not found");
  }

  return mapTrackToDTO(track);
};

/*
|--------------------------------------------------------------------------
| Get multiple tracks by IDs
|--------------------------------------------------------------------------
*/

export const getTracksByIds = async (
  trackIds: string[],
): Promise<TrackDTO[]> => {
  if (trackIds.length === 0) {
    return [];
  }

  const validTrackIds = trackIds.filter((id) => mongoose.isValidObjectId(id));

  if (validTrackIds.length === 0) {
    return [];
  }

  const tracks = await Track.find({
    _id: {
      $in: validTrackIds,
    },
  });

  /*
    |--------------------------------------------------------------------------
    | Preserve requested order
    |--------------------------------------------------------------------------
    |
    | MongoDB $in does not guarantee original array order.
    |
    */

  const trackMap = new Map(tracks.map((track) => [String(track._id), track]));

  const orderedTracks = validTrackIds
    .map((id) => trackMap.get(id))
    .filter((track): track is TrackDocument => Boolean(track));

  return mapTracksToDTO(orderedTracks);
};
