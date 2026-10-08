import { Redis } from "ioredis";

import { env } from "./env.js";

export const createRedisConnection = (
  maxRetriesPerRequest: number | null = 1,
) =>
  new Redis(env.REDIS_URL, {
    maxRetriesPerRequest,
  });
