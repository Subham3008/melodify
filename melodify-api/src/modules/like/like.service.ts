import mongoose from "mongoose";

import { Like } from "./like.model.js";

import { Track } from "../track/track.model.js";

import { getTracksByIds } from "../track/track.service.js";

import { ApiError } from "../../utils/ApiError.js";

import { enqueueRecommendationRefresh } from "../../queues/recommendation.queue.js";

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

  const existingLike = await Like.findOne({
    userId,
    trackId,
  });

  if (existingLike) {
    return;
  }

  await Like.create({
    userId,
    trackId,
  });

  /*
   |--------------------------------------------------------------------------
   | Recommendation refresh
   |--------------------------------------------------------------------------
   |
   | Like is a strong positive recommendation signal.
   | Heavy recommendation calculation is NOT done here.
   |
   | We only enqueue a BullMQ background job.
   |
   */

  await enqueueRecommendationRefresh({
    userId,
    trackId,
    reason: "LIKE_ADDED",
  });
};

export const unlikeTrack = async (
  userId: string,
  trackId: string,
): Promise<void> => {
  if (!mongoose.isValidObjectId(trackId)) {
    throw new ApiError(400, "Invalid track id");
  }

  const result = await Like.deleteOne({
    userId,
    trackId,
  });

  /*
   |--------------------------------------------------------------------------
   | Recommendation refresh
   |--------------------------------------------------------------------------
   |
   | Only enqueue when an actual like was deleted.
   |
   | If user clicks unlike on an already-unliked track,
   | there is no need to rebuild recommendation profile.
   |
   */

  if (result.deletedCount > 0) {
    await enqueueRecommendationRefresh({
      userId,
      trackId,
      reason: "LIKE_REMOVED",
    });
  }
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
