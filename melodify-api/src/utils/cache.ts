import { createRedisConnection } from "../config/redis.js";
import { logger } from "./logger.js";

/*
|--------------------------------------------------------------------------
| Redis cache connection
|--------------------------------------------------------------------------
|
| API process ke liye ek persistent Redis connection.
|
| Cache failure should NEVER break the actual API.
|
*/

const cacheRedis = createRedisConnection();

/*
|--------------------------------------------------------------------------
| Cache TTLs
|--------------------------------------------------------------------------
*/

export const CACHE_TTL = {
  PERSONALIZED_RECOMMENDATIONS: 300,

  POPULAR_TRACKS: 180,

  POPULAR_ARTISTS: 300,

  ARTIST_DETAILS: 1800,
} as const;

/*
|--------------------------------------------------------------------------
| Cache keys
|--------------------------------------------------------------------------
*/

export const cacheKeys = {
  recommendations: (userId: string, limit: number) =>
    `recommendations:user:${userId}:recommended:${limit}`,

  becauseYouListened: (userId: string, limit: number) =>
    `recommendations:user:${userId}:because-you-listened:${limit}`,

  moreFromLikedArtist: (userId: string, limit: number) =>
    `recommendations:user:${userId}:more-from-liked-artist:${limit}`,

  popularTracks: (limit: number) => `recommendations:popular-tracks:${limit}`,

  popularArtists: (limit: number) => `recommendations:popular-artists:${limit}`,

  artistDetails: (artistId: string, limit: number) =>
    `artists:${artistId}:details:${limit}`,
};

/*
|--------------------------------------------------------------------------
| Get cache
|--------------------------------------------------------------------------
*/

export const getCache = async <T>(key: string): Promise<T | null> => {
  try {
    const cached = await cacheRedis.get(key);

    if (!cached) {
      return null;
    }

    return JSON.parse(cached) as T;
  } catch (error) {
    logger.warn(
      {
        err: error,
        key,
      },
      "Redis cache read failed",
    );

    return null;
  }
};

/*
|--------------------------------------------------------------------------
| Set cache
|--------------------------------------------------------------------------
*/

export const setCache = async (
  key: string,
  value: unknown,
  ttlSeconds: number,
): Promise<void> => {
  try {
    await cacheRedis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (error) {
    logger.warn(
      {
        err: error,
        key,
      },
      "Redis cache write failed",
    );
  }
};

/*
|--------------------------------------------------------------------------
| Delete specific cache
|--------------------------------------------------------------------------
*/

export const deleteCache = async (key: string): Promise<void> => {
  try {
    await cacheRedis.del(key);
  } catch (error) {
    logger.warn(
      {
        err: error,
        key,
      },
      "Redis cache delete failed",
    );
  }
};

/*
|--------------------------------------------------------------------------
| Delete keys by pattern
|--------------------------------------------------------------------------
|
| SCAN use kar rahe hain instead of KEYS.
|
| KEYS production Redis par expensive ho sakta hai.
|
*/

export const deleteCacheByPattern = async (pattern: string): Promise<void> => {
  try {
    let cursor = "0";

    do {
      const [nextCursor, keys] = await cacheRedis.scan(
        cursor,
        "MATCH",
        pattern,
        "COUNT",
        100,
      );

      cursor = nextCursor;

      if (keys.length > 0) {
        await cacheRedis.del(...keys);
      }
    } while (cursor !== "0");
  } catch (error) {
    logger.warn(
      {
        err: error,
        pattern,
      },
      "Redis cache pattern delete failed",
    );
  }
};

/*
|--------------------------------------------------------------------------
| Invalidate one user's recommendation cache
|--------------------------------------------------------------------------
*/

export const invalidateUserRecommendationCache = async (
  userId: string,
): Promise<void> => {
  await deleteCacheByPattern(`recommendations:user:${userId}:*`);
};
