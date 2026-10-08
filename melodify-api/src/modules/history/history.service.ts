import mongoose from "mongoose";

import { PlaybackEvent, type PlaybackEventType } from "./history.model.js";

import { ApiError } from "../../utils/ApiError.js";

import { getTracksByIds } from "../track/track.service.js";

import { enqueueListeningEvent } from "../../queues/listening.queue.js";

/*
|--------------------------------------------------------------------------
| Record playback event
|--------------------------------------------------------------------------
*/

export const recordPlaybackEvent = async (
  userId: string,
  trackId: string,
  eventType: PlaybackEventType,
  positionSeconds = 0,
) => {
  /*
    |--------------------------------------------------------------------------
    | Validate Track ID
    |--------------------------------------------------------------------------
    */

  if (!mongoose.isValidObjectId(trackId)) {
    throw new ApiError(400, "Invalid track id");
  }

  /*
    |--------------------------------------------------------------------------
    | Make sure track actually exists
    |--------------------------------------------------------------------------
    */

  const tracks = await getTracksByIds([trackId]);

  if (tracks.length === 0) {
    throw new ApiError(404, "Track not found");
  }

  /*
    |--------------------------------------------------------------------------
    | Save event
    |--------------------------------------------------------------------------
    */

  const event = await PlaybackEvent.create({
    userId,
    trackId,
    eventType,
    positionSeconds,
  });

  await enqueueListeningEvent({
    eventId: String(event._id),
    userId,
    trackId,
    eventType,
    positionSeconds,
  });

  return {
    id: String(event._id),

    trackId: String(event.trackId),

    eventType: event.eventType,

    positionSeconds: event.positionSeconds,

    createdAt: event.createdAt,
  };
};

/*
|--------------------------------------------------------------------------
| Get recently played tracks
|--------------------------------------------------------------------------
|
| Only PLAYED events are considered.
|
| Same track may have many PLAYED events in database,
| but Recently Played should return each track only once.
|
*/

export const getRecentlyPlayed = async (userId: string, limit = 10) => {
  const safeLimit = Math.min(Math.max(limit, 1), 20);

  /*
    |--------------------------------------------------------------------------
    | Find most recent PLAYED event for every track
    |--------------------------------------------------------------------------
    */

  const recentEvents = await PlaybackEvent.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),

        eventType: "PLAYED",
      },
    },

    /*
        |--------------------------------------------------------------------------
        | Newest first
        |--------------------------------------------------------------------------
        */

    {
      $sort: {
        createdAt: -1,
      },
    },

    /*
        |--------------------------------------------------------------------------
        | One result per track
        |--------------------------------------------------------------------------
        */

    {
      $group: {
        _id: "$trackId",

        playedAt: {
          $first: "$createdAt",
        },
      },
    },

    /*
        |--------------------------------------------------------------------------
        | Restore latest order after grouping
        |--------------------------------------------------------------------------
        */

    {
      $sort: {
        playedAt: -1,
      },
    },

    {
      $limit: safeLimit,
    },
  ]);

  if (recentEvents.length === 0) {
    return [];
  }

  /*
    |--------------------------------------------------------------------------
    | Extract track IDs
    |--------------------------------------------------------------------------
    */

  const trackIds = recentEvents.map((event) => String(event._id));

  /*
    |--------------------------------------------------------------------------
    | Get full track data
    |--------------------------------------------------------------------------
    |
    | getTracksByIds already preserves the input order.
    |
    */

  const tracks = await getTracksByIds(trackIds);

  /*
    |--------------------------------------------------------------------------
    | Add lastPlayedAt
    |--------------------------------------------------------------------------
    */

  const playedAtMap = new Map(
    recentEvents.map((event) => [String(event._id), event.playedAt]),
  );

  return tracks.map((track) => ({
    ...track,

    lastPlayedAt: playedAtMap.get(track.id),
  }));
};
