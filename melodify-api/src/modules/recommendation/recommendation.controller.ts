import type { Request, Response } from "express";

import { ApiError } from "../../utils/ApiError.js";

import {
  getRecommendations,
  getBecauseYouListenedTo,
} from "./recommendation.service.js";

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

  /*
    |--------------------------------------------------------------------------
    | No recommendation available
    |--------------------------------------------------------------------------
    |
    | This is not an API error.
    |
    | Example:
    |
    | New user
    | ↓
    | no listening history
    | ↓
    | data: null
    |
    */

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
