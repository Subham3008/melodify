import { ApiError } from "../../utils/ApiError.js";

import { Track } from "../track/track.model.js";

import { discoverTracks, getTracksByIds } from "../track/track.service.js";

import {
  fetchJamendoArtistById,
  type JamendoArtist,
} from "../track/jamendo.service.js";

import type { TrackDTO } from "../track/track.types.js";

export interface ArtistDetailsResult {
  artist: JamendoArtist;

  tracks: TrackDTO[];
}

/*
|--------------------------------------------------------------------------
| Get artist page data
|--------------------------------------------------------------------------
*/

export const getArtistDetails = async (
  artistId: string,

  limit = 20,
): Promise<ArtistDetailsResult> => {
  const normalizedArtistId = artistId.trim();

  if (!normalizedArtistId) {
    throw new ApiError(
      400,

      "Artist id is required",
    );
  }

  const safeLimit = Math.min(
    Math.max(limit, 1),

    50,
  );

  /*
    |--------------------------------------------------------------------------
    | Artist metadata
    |--------------------------------------------------------------------------
    */

  const artist = await fetchJamendoArtistById(normalizedArtistId);

  if (!artist) {
    throw new ApiError(
      404,

      "Artist not found",
    );
  }

  /*
    |--------------------------------------------------------------------------
    | First try MongoDB
    |--------------------------------------------------------------------------
    */

  let storedTracks = await Track.find({
    artistId: normalizedArtistId,
  })
    .sort({
      lastSyncedAt: -1,
    })
    .limit(safeLimit)
    .lean();

  /*
    |--------------------------------------------------------------------------
    | Fetch more tracks from Jamendo when needed
    |--------------------------------------------------------------------------
    |
    | Important:
    |
    | Artist-page tracks are:
    |
    | isDiscoverable = false
    |
    | so they do NOT pollute Discover Music.
    |
    */

  if (storedTracks.length < safeLimit) {
    await discoverTracks({
      artistId: normalizedArtistId,

      limit: safeLimit,

      offset: 0,

      isDiscoverable: false,
    });

    storedTracks = await Track.find({
      artistId: normalizedArtistId,
    })
      .sort({
        lastSyncedAt: -1,
      })
      .limit(safeLimit)
      .lean();
  }

  const trackIds = storedTracks.map((track) => String(track._id));

  const tracks = await getTracksByIds(trackIds);

  return {
    artist,

    tracks,
  };
};
