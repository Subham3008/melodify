import type { Request, Response } from "express";

import { ApiError } from "../../utils/ApiError.js";

import { CACHE_TTL, cacheKeys, getCache, setCache } from "../../utils/cache.js";

import {
  getRecommendations,
  getBecauseYouListenedTo,
  getMoreFromLikedArtist,
} from "./recommendation.service.js";

import {
  getPopularTracks,
  getPopularArtists,
  type PopularArtist,
} from "./popular.service.js";

import {
  getArtistDetails,
  type ArtistDetailsResult,
} from "./artist.service.js";

import type { TrackDTO } from "../track/track.types.js";

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

  const cacheKey = cacheKeys.recommendations(userId, limit);

  /*
    |--------------------------------------------------------------------------
    | Redis first
    |--------------------------------------------------------------------------
    */

  const cached = await getCache<TrackDTO[]>(cacheKey);

  if (cached) {
    res.status(200).json({
      success: true,

      count: cached.length,

      data: cached,
    });

    return;
  }

  /*
    |--------------------------------------------------------------------------
    | Calculate
    |--------------------------------------------------------------------------
    */

  const tracks = await getRecommendations(userId, limit);

  await setCache(cacheKey, tracks, CACHE_TTL.PERSONALIZED_RECOMMENDATIONS);

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

  const cacheKey = cacheKeys.becauseYouListened(userId, limit);

  type BecauseResult = {
    seedTrack: TrackDTO;

    tracks: TrackDTO[];
  };

  const cached = await getCache<BecauseResult | null>(cacheKey);

  /*
    |--------------------------------------------------------------------------
    | Cached result
    |--------------------------------------------------------------------------
    */

  if (cached) {
    res.status(200).json({
      success: true,

      count: cached.tracks.length,

      data: cached,
    });

    return;
  }

  const result = await getBecauseYouListenedTo(userId, limit);

  /*
    |--------------------------------------------------------------------------
    | No result
    |--------------------------------------------------------------------------
    |
    | Null result ko cache nahi kar rahe.
    |
    | New user kuch seconds later song play kare to section immediately
    | available ho sake.
    |
    */

  if (!result) {
    res.status(200).json({
      success: true,

      data: null,
    });

    return;
  }

  await setCache(cacheKey, result, CACHE_TTL.PERSONALIZED_RECOMMENDATIONS);

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

  const cacheKey = cacheKeys.moreFromLikedArtist(userId, limit);

  type MoreFromResult = {
    artist: {
      artistId: string;

      artistName: string;
    };

    tracks: TrackDTO[];
  };

  const cached = await getCache<MoreFromResult | null>(cacheKey);

  if (cached) {
    res.status(200).json({
      success: true,

      count: cached.tracks.length,

      data: cached,
    });

    return;
  }

  const result = await getMoreFromLikedArtist(userId, limit);

  if (!result) {
    res.status(200).json({
      success: true,

      data: null,
    });

    return;
  }

  await setCache(cacheKey, result, CACHE_TTL.PERSONALIZED_RECOMMENDATIONS);

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

  const cacheKey = cacheKeys.popularTracks(limit);

  const cached = await getCache<TrackDTO[]>(cacheKey);

  if (cached) {
    res.status(200).json({
      success: true,

      count: cached.length,

      data: cached,
    });

    return;
  }

  const tracks = await getPopularTracks(limit);

  await setCache(cacheKey, tracks, CACHE_TTL.POPULAR_TRACKS);

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

  const cacheKey = cacheKeys.popularArtists(limit);

  const cached = await getCache<PopularArtist[]>(cacheKey);

  if (cached) {
    res.status(200).json({
      success: true,

      count: cached.length,

      data: cached,
    });

    return;
  }

  const artists = await getPopularArtists(limit);

  await setCache(cacheKey, artists, CACHE_TTL.POPULAR_ARTISTS);

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

  const cacheKey = cacheKeys.artistDetails(artistId, limit);

  const cached = await getCache<ArtistDetailsResult>(cacheKey);

  if (cached) {
    res.status(200).json({
      success: true,

      count: cached.tracks.length,

      data: cached,
    });

    return;
  }

  const result = await getArtistDetails(artistId, limit);

  await setCache(cacheKey, result, CACHE_TTL.ARTIST_DETAILS);

  res.status(200).json({
    success: true,

    count: result.tracks.length,

    data: {
      artist: result.artist,

      tracks: result.tracks,
    },
  });
};
