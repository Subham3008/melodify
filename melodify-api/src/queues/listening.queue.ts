import { Queue } from "bullmq";

import { createRedisConnection } from "../config/redis.js";
import { logger } from "../utils/logger.js";
import type { PlaybackEventType } from "../modules/history/history.model.js";

export const LISTENING_QUEUE_NAME = "listening-events";

export interface ListeningEventJobData {
  eventId: string;
  userId: string;
  trackId: string;
  eventType: PlaybackEventType;
  positionSeconds: number;
}

const connection = createRedisConnection();

export const listeningQueue = new Queue<ListeningEventJobData>(
  LISTENING_QUEUE_NAME,
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

export const enqueueListeningEvent = async (
  data: ListeningEventJobData,
): Promise<void> => {
  try {
    await listeningQueue.add("process-listening-event", data, {
      jobId: data.eventId,
    });
  } catch (error) {
    logger.error(
      {
        err: error,
        eventId: data.eventId,
        userId: data.userId,
        trackId: data.trackId,
      },
      "Failed to enqueue listening event",
    );
  }
};
