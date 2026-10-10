import mongoose from "mongoose";

import { Track } from "./track.model.js";

import { fetchJamendoTracks } from "./jamendo.service.js";

import { ApiError } from "../../utils/ApiError.js";

import type { NormalizedTrack, TrackDTO } from "./track.types.js";

interface DiscoverTracksInput {
  limit?: number;

  offset?: number;

  search?: string;

  artistId?: string;

  /*
  |--------------------------------------------------------------------------
  | Discover visibility
  |--------------------------------------------------------------------------
  |
  | true
  | → normal Discover Music catalog
  |
  | false
  | → recommendation/search fetched track
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
| Map MongoDB Track -> API DTO
|--------------------------------------------------------------------------
*/

const mapTrackToDTO = (track: InstanceType<typeof Track>): TrackDTO => {
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

    imageUrl: track.imageUrl,

    streamUrl: track.streamUrl,

    licenseUrl: track.licenseUrl,

    downloadAllowed: track.downloadAllowed,
  };
};

/*
|--------------------------------------------------------------------------
| Save / upsert tracks
|--------------------------------------------------------------------------
|
| Normal Discover fetch:
|
| isDiscoverable = true
|
| Recommendation / search-specific fetch:
|
| isDiscoverable = false
|
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
      |
      | IMPORTANT:
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
  | Separate local DB flag from Jamendo API options
  |--------------------------------------------------------------------------
  |
  | Jamendo API does not know what "isDiscoverable" means.
  |
  */

  const { isDiscoverable = true, ...jamendoInput } = input;

  const jamendoTracks = await fetchJamendoTracks(jamendoInput);

  /*
  |--------------------------------------------------------------------------
  | Persist with correct visibility
  |--------------------------------------------------------------------------
  */

  await saveTracks(jamendoTracks, isDiscoverable);

  const externalIds = jamendoTracks.map((track) => track.externalId);

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

  const safeLimit = Math.min(Math.max(limit, 1), 50);

  const skip = (safePage - 1) * safeLimit;

  const normalizedSearch = search?.trim() || "";

  const query: Record<string, unknown> = {};

  /*
  |--------------------------------------------------------------------------
  | Search mode
  |--------------------------------------------------------------------------
  |
  | Search is intentionally NOT restricted to:
  |
  | isDiscoverable = true
  |
  | This means user can search:
  |
  | normal catalog tracks
  | recommendation-fetched tracks
  | Because You Listened To tracks
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
    | THIS IS THE IMPORTANT FIX.
    |
    | Recommendation-specific tracks must NOT enter
    | the shared Discover Music catalog.
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
    return tracks.map(mapTrackToDTO);
  }

  /*
  |--------------------------------------------------------------------------
  | Normal Discover fallback
  |--------------------------------------------------------------------------
  |
  | There may be no isDiscoverable=true records yet because:
  |
  | 1. field was newly introduced
  | 2. old database records don't have it
  | 3. fresh database
  |
  | In that situation fetch normal popular Jamendo catalog
  | and explicitly mark it discoverable.
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
  | IMPORTANT:
  |
  | Search results must NOT automatically become
  | part of Discover Music.
  |
  | Example:
  |
  | User searches "Cole Powell"
  |
  | We don't want 20 Cole Powell tracks suddenly appearing
  | in everybody's Discover Music section.
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
  | Preserve input order
  |--------------------------------------------------------------------------
  |
  | MongoDB $in does not guarantee original array order.
  |
  */

  const trackMap = new Map(tracks.map((track) => [String(track._id), track]));

  return validTrackIds
    .map((id) => trackMap.get(id))
    .filter((track): track is NonNullable<typeof track> => Boolean(track))
    .map(mapTrackToDTO);
};
