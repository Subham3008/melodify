import type { Request, Response } from "express";

import { ApiError } from "../../utils/ApiError.js";

import type { PlaybackEventType } from "./history.model.js";

import { getRecentlyPlayed, recordPlaybackEvent } from "./history.service.js";

/*
|--------------------------------------------------------------------------
| POST playback event
|--------------------------------------------------------------------------
*/

export const createPlaybackEventController = async (
  req: Request<
    {},
    {},
    {
      trackId: string;

      eventType: PlaybackEventType;

      positionSeconds?: number;
    }
  >,

  res: Response,
): Promise<void> => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const { trackId, eventType, positionSeconds = 0 } = req.body;

  const event = await recordPlaybackEvent(
    userId,
    trackId,
    eventType,
    positionSeconds,
  );

  res.status(201).json({
    success: true,

    message: "Playback event recorded",

    data: event,
  });
};

/*
|--------------------------------------------------------------------------
| GET recently played
|--------------------------------------------------------------------------
*/

export const getRecentlyPlayedController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const requestedLimit = Number(req.query.limit ?? 10);

  const limit = Number.isFinite(requestedLimit) ? requestedLimit : 10;

  const tracks = await getRecentlyPlayed(userId, limit);

  res.status(200).json({
    success: true,

    count: tracks.length,

    data: tracks,
  });
};
