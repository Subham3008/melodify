import { Queue } from "bullmq";

import { Redis } from "ioredis";

import { env } from "../config/env.js";

import { AUDIO_PROCESSING_QUEUE_NAME } from "./audio-processing.constants.js";

import type { AudioProcessingJobData } from "./audio-processing.constants.js";

/*
|--------------------------------------------------------------------------
| Redis connection for producer
|--------------------------------------------------------------------------
*/

const connection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

/*
|--------------------------------------------------------------------------
| Queue
|--------------------------------------------------------------------------
*/

export const audioProcessingQueue = new Queue<AudioProcessingJobData>(
  AUDIO_PROCESSING_QUEUE_NAME,
  {
    connection,
  },
);

/*
|--------------------------------------------------------------------------
| Add processing job
|--------------------------------------------------------------------------
*/

export const enqueueAudioProcessing = async (
  trackId: string,
): Promise<void> => {
  await audioProcessingQueue.add(
    "process-track",
    {
      trackId,
    },
    {
      attempts: 3,

      backoff: {
        type: "exponential",

        delay: 5000,
      },

      removeOnComplete: 100,

      removeOnFail: 500,
    },
  );
};
