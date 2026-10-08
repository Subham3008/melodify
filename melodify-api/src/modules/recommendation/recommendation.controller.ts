import type { Request, Response } from "express";

import { ApiError } from "../../utils/ApiError.js";
import { getRecommendations } from "./recommendation.service.js";

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
