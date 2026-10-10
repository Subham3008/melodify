import { Queue } from "bullmq";

import { createRedisConnection } from "../config/redis.js";
import { logger } from "../utils/logger.js";

export const RECOMMENDATION_QUEUE_NAME = "recommendation-profile-refresh";

export type RecommendationRefreshReason =
  | "LIKE_ADDED"
  | "LIKE_REMOVED"
  | "PLAYLIST_TRACK_ADDED"
  | "PLAYLIST_TRACK_REMOVED"
  | "PLAYLIST_DELETED";

export interface RecommendationRefreshJobData {
  userId: string;
  reason: RecommendationRefreshReason;
  trackId?: string;
  playlistId?: string;
}

const connection = createRedisConnection();

export const recommendationQueue = new Queue<RecommendationRefreshJobData>(
  RECOMMENDATION_QUEUE_NAME,
  {
    connection,

    defaultJobOptions: {
      attempts: 3,

      backoff: {
        type: "exponential",
        delay: 1000,
      },

      removeOnComplete: 500,
      removeOnFail: 1000,
    },
  },
);

export const enqueueRecommendationRefresh = async (
  data: RecommendationRefreshJobData,
): Promise<void> => {
  try {
    await recommendationQueue.add("refresh-recommendation-profile", data);
  } catch (error) {
    logger.error(
      {
        err: error,
        userId: data.userId,
        reason: data.reason,
        trackId: data.trackId,
        playlistId: data.playlistId,
      },
      "Failed to enqueue recommendation profile refresh",
    );
  }
};
