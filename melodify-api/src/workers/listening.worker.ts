import { Worker } from "bullmq";

import { createRedisConnection } from "../config/redis.js";

import { connectDatabase } from "../config/database.js";

import {
  LISTENING_QUEUE_NAME,
  type ListeningEventJobData,
} from "../queues/listening.queue.js";

import { rebuildRecommendationProfile } from "../modules/recommendation/recommendation.service.js";

import { logger } from "../utils/logger.js";

const startWorker = async (): Promise<void> => {
  await connectDatabase();

  const connection = createRedisConnection(null);

  const worker = new Worker<ListeningEventJobData>(
    LISTENING_QUEUE_NAME,

    async (job) => {
      await rebuildRecommendationProfile(job.data.userId);
    },

    {
      connection,

      concurrency: 5,
    },
  );

  worker.on("completed", (job) => {
    logger.info(
      {
        jobId: job.id,
        userId: job.data.userId,
      },

      "Listening event processed",
    );
  });

  worker.on("failed", (job, error) => {
    logger.error(
      {
        jobId: job?.id,

        err: error,
      },

      "Listening event job failed",
    );
  });

  logger.info("Listening worker started");
};

startWorker().catch((error) => {
  logger.fatal(
    {
      err: error,
    },

    "Failed to start listening worker",
  );

  process.exit(1);
});
