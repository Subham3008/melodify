import mongoose from "mongoose";

import { Track } from "./track.model.js";

import { fetchJamendoTracks } from "./jamendo.service.js";

import { ApiError } from "../../utils/ApiError.js";

import { getS3MediaUrl } from "./s3-media.service.js";

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
| Jamendo:
| existing URLs are returned as-is.
|
| S3:
| audioStorageKey -> signed streamUrl
| imageStorageKey -> signed imageUrl
|
| External image URL:
| existing imageUrl remains untouched.
|
*/

const mapTrackToDTO = async (track: TrackDocument): Promise<TrackDTO> => {
  let imageUrl = track.imageUrl;

  let streamUrl = track.streamUrl;

  /*
    |--------------------------------------------------------------------------
    | S3 track
    |--------------------------------------------------------------------------
    */

  if (track.source === "s3") {
    /*
      |--------------------------------------------------------------------------
      | Audio
      |--------------------------------------------------------------------------
      */

    if (track.audioStorageKey) {
      streamUrl = await getS3MediaUrl(track.audioStorageKey);
    }

    /*
      |--------------------------------------------------------------------------
      | Cover
      |--------------------------------------------------------------------------
      |
      | If admin uploaded cover:
      | use private S3 signed URL.
      |
      | If admin used external imageUrl:
      | imageStorageKey will be null
      | and existing imageUrl is preserved.
      |
      */

    if (track.imageStorageKey) {
      imageUrl = await getS3MediaUrl(track.imageStorageKey);
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

    licenseUrl: track.licenseUrl,

    downloadAllowed: track.downloadAllowed,
  };
};

/*
|--------------------------------------------------------------------------
| Map multiple tracks
|--------------------------------------------------------------------------
|
| Signed URLs can be generated in parallel.
|
*/

const mapTracksToDTO = async (tracks: TrackDocument[]): Promise<TrackDTO[]> => {
  return Promise.all(tracks.map(mapTrackToDTO));
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
          | Existing discoverable track must remain discoverable.
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
    | Separate local visibility flag from Jamendo options
    |--------------------------------------------------------------------------
    */

  const {
    isDiscoverable = true,

    ...jamendoInput
  } = input;

  const jamendoTracks = await fetchJamendoTracks(jamendoInput);

  /*
    |--------------------------------------------------------------------------
    | Save with correct visibility
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
    | Preserve Jamendo order
    |--------------------------------------------------------------------------
    */

  const trackMap = new Map(
    storedTracks.map((track) => [track.externalId, track]),
  );

  const orderedTracks = jamendoTracks
    .map((track) => trackMap.get(track.externalId))
    .filter((track): track is TrackDocument => Boolean(track));

  return mapTracksToDTO(orderedTracks);
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
    | Jamendo fallback result must not automatically
    | enter Discover catalog.
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
    */

  const trackMap = new Map(tracks.map((track) => [String(track._id), track]));

  const orderedTracks = validTrackIds
    .map((id) => trackMap.get(id))
    .filter((track): track is TrackDocument => Boolean(track));

  return mapTracksToDTO(orderedTracks);
};
