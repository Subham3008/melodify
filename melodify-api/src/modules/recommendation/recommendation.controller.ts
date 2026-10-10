import type { Request, Response } from "express";

import { ApiError } from "../../utils/ApiError.js";

import {
  getRecommendations,
  getBecauseYouListenedTo,
  getMoreFromLikedArtist,
} from "./recommendation.service.js";

import { getPopularTracks, getPopularArtists } from "./popular.service.js";

import { getArtistDetails } from "./artist.service.js";

/*
|--------------------------------------------------------------------------
| Recommended For You
|--------------------------------------------------------------------------
*/

export const getRecommendationsController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const requestedLimit = Number(req.query.limit ?? 10);

  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(Math.floor(requestedLimit), 1), 20)
    : 10;

  const tracks = await getRecommendations(userId, limit);

  res.status(200).json({
    success: true,

    count: tracks.length,

    data: tracks,
  });
};

/*
|--------------------------------------------------------------------------
| Because You Listened To
|--------------------------------------------------------------------------
*/

export const getBecauseYouListenedToController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const requestedLimit = Number(req.query.limit ?? 6);

  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(Math.floor(requestedLimit), 1), 10)
    : 6;

  const result = await getBecauseYouListenedTo(userId, limit);

  if (!result) {
    res.status(200).json({
      success: true,

      data: null,
    });

    return;
  }

  res.status(200).json({
    success: true,

    count: result.tracks.length,

    data: {
      seedTrack: result.seedTrack,

      tracks: result.tracks,
    },
  });
};

/*
|--------------------------------------------------------------------------
| More From Artists You Like
|--------------------------------------------------------------------------
*/

export const getMoreFromLikedArtistController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const requestedLimit = Number(req.query.limit ?? 6);

  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(Math.floor(requestedLimit), 1), 10)
    : 6;

  const result = await getMoreFromLikedArtist(userId, limit);

  if (!result) {
    res.status(200).json({
      success: true,

      data: null,
    });

    return;
  }

  res.status(200).json({
    success: true,

    count: result.tracks.length,

    data: {
      artist: result.artist,

      tracks: result.tracks,
    },
  });
};

/*
|--------------------------------------------------------------------------
| Popular tracks
|--------------------------------------------------------------------------
*/

export const getPopularTracksController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const requestedLimit = Number(req.query.limit ?? 10);

  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(Math.floor(requestedLimit), 1), 20)
    : 10;

  const tracks = await getPopularTracks(limit);

  res.status(200).json({
    success: true,

    count: tracks.length,

    data: tracks,
  });
};

/*
|--------------------------------------------------------------------------
| Popular Artists
|--------------------------------------------------------------------------
*/

export const getPopularArtistsController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const requestedLimit = Number(req.query.limit ?? 6);

  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(Math.floor(requestedLimit), 1), 10)
    : 6;

  const artists = await getPopularArtists(limit);

  res.status(200).json({
    success: true,

    count: artists.length,

    data: artists,
  });
};

/*
|--------------------------------------------------------------------------
| Artist Details
|--------------------------------------------------------------------------
*/

export const getArtistDetailsController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const artistIdParam = req.params.artistId;

  const artistId = Array.isArray(artistIdParam)
    ? artistIdParam[0]
    : artistIdParam;

  if (!artistId) {
    throw new ApiError(400, "Artist id is required");
  }

  const requestedLimit = Number(req.query.limit ?? 20);

  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(Math.floor(requestedLimit), 1), 50)
    : 20;

  const result = await getArtistDetails(artistId, limit);

  res.status(200).json({
    success: true,

    count: result.tracks.length,

    data: {
      artist: result.artist,

      tracks: result.tracks,
    },
  });
};
