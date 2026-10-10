import { Worker } from "bullmq";

import { createRedisConnection } from "../config/redis.js";

import { connectDatabase } from "../config/database.js";

import {
  LISTENING_QUEUE_NAME,
  type ListeningEventJobData,
} from "../queues/listening.queue.js";

import {
  RECOMMENDATION_QUEUE_NAME,
  type RecommendationRefreshJobData,
} from "../queues/recommendation.queue.js";

import { rebuildRecommendationProfile } from "../modules/recommendation/recommendation.service.js";

import { logger } from "../utils/logger.js";

const startWorker = async (): Promise<void> => {
  await connectDatabase();

  /*
  |--------------------------------------------------------------------------
  | Listening event worker
  |--------------------------------------------------------------------------
  |
  | Handles:
  |
  | PLAYED
  | COMPLETED
  | SKIPPED
  |
  */

  const listeningWorker = new Worker<ListeningEventJobData>(
    LISTENING_QUEUE_NAME,

    async (job) => {
      await rebuildRecommendationProfile(job.data.userId);
    },

    {
      connection: createRedisConnection(null),

      concurrency: 5,
    },
  );

  listeningWorker.on(
    "completed",

    (job) => {
      logger.info(
        {
          jobId: job.id,

          userId: job.data.userId,

          eventType: job.data.eventType,

          trackId: job.data.trackId,
        },

        "Listening event processed",
      );
    },
  );

  listeningWorker.on(
    "failed",

    (job, error) => {
      logger.error(
        {
          jobId: job?.id,

          userId: job?.data.userId,

          err: error,
        },

        "Listening event job failed",
      );
    },
  );

  /*
  |--------------------------------------------------------------------------
  | Recommendation refresh worker
  |--------------------------------------------------------------------------
  |
  | Handles stronger recommendation signals:
  |
  | LIKE_ADDED
  | LIKE_REMOVED
  | PLAYLIST_TRACK_ADDED
  | PLAYLIST_TRACK_REMOVED
  | PLAYLIST_DELETED
  |
  | Like / playlist API does NOT calculate recommendations directly.
  |
  | It only adds a BullMQ job.
  |
  | Worker rebuilds the recommendation profile asynchronously.
  |
  */

  const recommendationWorker = new Worker<RecommendationRefreshJobData>(
    RECOMMENDATION_QUEUE_NAME,

    async (job) => {
      await rebuildRecommendationProfile(job.data.userId);
    },

    {
      connection: createRedisConnection(null),

      concurrency: 5,
    },
  );

  recommendationWorker.on(
    "completed",

    (job) => {
      logger.info(
        {
          jobId: job.id,

          userId: job.data.userId,

          reason: job.data.reason,

          trackId: job.data.trackId,

          playlistId: job.data.playlistId,
        },

        "Recommendation profile refresh processed",
      );
    },
  );

  recommendationWorker.on(
    "failed",

    (job, error) => {
      logger.error(
        {
          jobId: job?.id,

          userId: job?.data.userId,

          reason: job?.data.reason,

          err: error,
        },

        "Recommendation profile refresh job failed",
      );
    },
  );

  logger.info("Listening worker started");

  logger.info("Recommendation refresh worker started");
};

startWorker().catch((error) => {
  logger.fatal(
    {
      err: error,
    },

    "Failed to start recommendation workers",
  );

  process.exit(1);
});
