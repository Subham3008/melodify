import { ApiError } from "../../utils/ApiError.js";

import { Track } from "./track.model.js";

import { discoverTracks, getTracksByIds } from "./track.service.js";

import type { TrackDTO } from "./track.types.js";

export interface AlbumDetails {
  albumId: string;

  albumName: string;

  artistId: string;

  artistName: string;

  imageUrl: string;
}

export interface AlbumDetailsResult {
  album: AlbumDetails;

  tracks: TrackDTO[];
}

/*
|--------------------------------------------------------------------------
| Album details
|--------------------------------------------------------------------------
*/

export const getAlbumDetails = async (
  albumId: string,
  limit = 50,
): Promise<AlbumDetailsResult> => {
  const normalizedAlbumId = albumId.trim();

  if (!normalizedAlbumId) {
    throw new ApiError(400, "Album id is required");
  }

  const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 100);

  /*
    |--------------------------------------------------------------------------
    | MongoDB first
    |--------------------------------------------------------------------------
    */

  let albumTracks = await Track.find({
    albumId: normalizedAlbumId,
  })
    .sort({
      createdAt: 1,
    })
    .limit(safeLimit);

  /*
    |--------------------------------------------------------------------------
    | Album not available locally
    |--------------------------------------------------------------------------
    |
    | Jamendo se fetch karo.
    |
    | IMPORTANT:
    |
    | Album-page tracks Discover Music me automatically enter nahi karenge.
    |
    */

  if (albumTracks.length === 0) {
    await discoverTracks({
      albumId: normalizedAlbumId,

      limit: safeLimit,

      offset: 0,

      isDiscoverable: false,
    });

    albumTracks = await Track.find({
      albumId: normalizedAlbumId,
    })
      .sort({
        createdAt: 1,
      })
      .limit(safeLimit);
  }

  /*
    |--------------------------------------------------------------------------
    | Invalid / missing album
    |--------------------------------------------------------------------------
    */

  if (albumTracks.length === 0) {
    throw new ApiError(404, "Album not found");
  }

  const firstTrack = albumTracks[0];

  if (!firstTrack) {
    throw new ApiError(404, "Album not found");
  }

  /*
    |--------------------------------------------------------------------------
    | Preserve MongoDB result order
    |--------------------------------------------------------------------------
    */

  const trackIds = albumTracks.map((track) => String(track._id));

  const tracks = await getTracksByIds(trackIds);

  /*
    |--------------------------------------------------------------------------
    | Album metadata
    |--------------------------------------------------------------------------
    |
    | Jamendo track already contains:
    |
    | albumId
    | albumName
    | artistId
    | artistName
    | imageUrl
    |
    | So separate Album collection isn't necessary for MVP.
    |
    */

  const album: AlbumDetails = {
    albumId: normalizedAlbumId,

    albumName: firstTrack.albumName || "Unknown Album",

    artistId: firstTrack.artistId,

    artistName: firstTrack.artistName,

    imageUrl: firstTrack.imageUrl || "",
  };

  return {
    album,

    tracks,
  };
};
