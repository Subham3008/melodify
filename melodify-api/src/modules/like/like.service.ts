import mongoose from "mongoose";

import { Like } from "./like.model.js";

import { Track } from "../track/track.model.js";

import { getTracksByIds } from "../track/track.service.js";

import { ApiError } from "../../utils/ApiError.js";

export const likeTrack = async (
  userId: string,
  trackId: string,
): Promise<void> => {
  if (!mongoose.isValidObjectId(trackId)) {
    throw new ApiError(400, "Invalid track id");
  }

  const trackExists = await Track.exists({
    _id: trackId,
  });

  if (!trackExists) {
    throw new ApiError(404, "Track not found");
  }

  /*
    |--------------------------------------------------------------------------
    | Upsert
    |--------------------------------------------------------------------------
    |
    | Already liked → nothing duplicate
    | Not liked     → create like
    |
    */

  await Like.findOneAndUpdate(
    {
      userId,
      trackId,
    },

    {
      $setOnInsert: {
        userId,
        trackId,
      },
    },

    {
      upsert: true,
      new: true,
    },
  );
};

export const unlikeTrack = async (
  userId: string,
  trackId: string,
): Promise<void> => {
  if (!mongoose.isValidObjectId(trackId)) {
    throw new ApiError(400, "Invalid track id");
  }

  await Like.deleteOne({
    userId,
    trackId,
  });
};

export const getLikedTracks = async (userId: string) => {
  const likes = await Like.find({
    userId,
  })
    .sort({
      createdAt: -1,
    })
    .select("trackId");

  const trackIds = likes.map((like) => String(like.trackId));

  return getTracksByIds(trackIds);
};
