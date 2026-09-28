import type { Request, Response } from "express";

import { ApiError } from "../../utils/ApiError.js";

import { getLikedTracks, likeTrack, unlikeTrack } from "./like.service.js";

export const likeTrackController = async (
  req: Request<{
    trackId: string;
  }>,
  res: Response,
): Promise<void> => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const { trackId } = req.params;

  await likeTrack(userId, trackId);

  res.status(201).json({
    success: true,

    message: "Track liked",

    data: {
      trackId,
      liked: true,
    },
  });
};

export const unlikeTrackController = async (
  req: Request<{
    trackId: string;
  }>,
  res: Response,
): Promise<void> => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const { trackId } = req.params;

  await unlikeTrack(userId, trackId);

  res.status(200).json({
    success: true,

    message: "Track unliked",

    data: {
      trackId,
      liked: false,
    },
  });
};

export const getLikedTracksController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const tracks = await getLikedTracks(userId);

  res.status(200).json({
    success: true,

    count: tracks.length,

    data: tracks,
  });
};
