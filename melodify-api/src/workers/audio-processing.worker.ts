import { Worker } from "bullmq";

import { Redis } from "ioredis";

import { env } from "../config/env.js";

import { AUDIO_PROCESSING_QUEUE_NAME } from "../queues/audio-processing.constants.js";

import type { AudioProcessingJobData } from "../queues/audio-processing.constants.js";

import { processTrackAudio } from "../modules/track/audio-processing.service.js";

import { connectDatabase } from "../config/database.js";

/*
|--------------------------------------------------------------------------
| Redis worker connection
|--------------------------------------------------------------------------
*/

const connection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

/*
|--------------------------------------------------------------------------
| Start worker
|--------------------------------------------------------------------------
*/

const startWorker = async (): Promise<void> => {
  await connectDatabase();

  const worker = new Worker<AudioProcessingJobData>(
    AUDIO_PROCESSING_QUEUE_NAME,

    async (job) => {
      console.log(`[audio-worker] Processing track ${job.data.trackId}`);

      await processTrackAudio(job.data.trackId);
    },

    {
      connection,

      /*
          |--------------------------------------------------------------------------
          | FFmpeg is CPU intensive.
          |
          | Start with 1.
          |--------------------------------------------------------------------------
          */

      concurrency: 1,
    },
  );

  worker.on("completed", (job) => {
    console.log(`[audio-worker] Track ${job.data.trackId} ready`);
  });

  worker.on("failed", (job, error) => {
    console.error(`[audio-worker] Track ${job?.data.trackId} failed`, error);
  });

  console.log("Audio processing worker started");
};

startWorker().catch((error) => {
  console.error("Failed to start audio processing worker", error);

  process.exit(1);
});
