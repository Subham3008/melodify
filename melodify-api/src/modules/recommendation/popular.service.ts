import { PlaybackEvent } from "../history/history.model.js";
import { Like } from "../like/like.model.js";
import { Playlist } from "../playlist/playlist.model.js";
import { Track } from "../track/track.model.js";

import { discoverTracks, getTracksByIds } from "../track/track.service.js";

import type { TrackDTO } from "../track/track.types.js";

/*
|--------------------------------------------------------------------------
| Popularity weights
|--------------------------------------------------------------------------
*/

const PLAYED_SCORE = 1;
const COMPLETED_SCORE = 3;
const LIKE_SCORE = 5;
const PLAYLIST_SCORE = 4;

/*
|--------------------------------------------------------------------------
| Popular on Melodify
|--------------------------------------------------------------------------
|
| Global ranking.
|
| NOT user-specific.
|
*/

export const getPopularTracks = async (limit = 10): Promise<TrackDTO[]> => {
  const safeLimit = Math.min(Math.max(limit, 1), 20);

  /*
  |--------------------------------------------------------------------------
  | Recent popularity window
  |--------------------------------------------------------------------------
  |
  | Old plays shouldn't dominate forever.
  |
  | We use the last 30 days.
  |
  */

  const since = new Date();

  since.setDate(since.getDate() - 30);

  /*
  |--------------------------------------------------------------------------
  | Playback signals
  |--------------------------------------------------------------------------
  */

  const playbackStats = await PlaybackEvent.aggregate<{
    _id: unknown;
    playedCount: number;
    completedCount: number;
  }>([
    {
      $match: {
        createdAt: {
          $gte: since,
        },

        eventType: {
          $in: ["PLAYED", "COMPLETED"],
        },
      },
    },

    {
      $group: {
        _id: "$trackId",

        playedCount: {
          $sum: {
            $cond: [
              {
                $eq: ["$eventType", "PLAYED"],
              },
              1,
              0,
            ],
          },
        },

        completedCount: {
          $sum: {
            $cond: [
              {
                $eq: ["$eventType", "COMPLETED"],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);

  /*
  |--------------------------------------------------------------------------
  | Like signals
  |--------------------------------------------------------------------------
  */

  const likeStats = await Like.aggregate<{
    _id: unknown;
    likeCount: number;
  }>([
    {
      $group: {
        _id: "$trackId",

        likeCount: {
          $sum: 1,
        },
      },
    },
  ]);

  /*
  |--------------------------------------------------------------------------
  | Playlist signals
  |--------------------------------------------------------------------------
  */

  const playlistStats = await Playlist.aggregate<{
    _id: unknown;
    playlistCount: number;
  }>([
    {
      $unwind: "$tracks",
    },

    {
      $group: {
        _id: "$tracks.trackId",

        playlistCount: {
          $sum: 1,
        },
      },
    },
  ]);

  /*
  |--------------------------------------------------------------------------
  | Merge scores
  |--------------------------------------------------------------------------
  */

  const scores = new Map<string, number>();

  const addScore = (trackId: unknown, score: number) => {
    const id = String(trackId);

    scores.set(id, (scores.get(id) ?? 0) + score);
  };

  for (const item of playbackStats) {
    addScore(
      item._id,
      item.playedCount * PLAYED_SCORE + item.completedCount * COMPLETED_SCORE,
    );
  }

  for (const item of likeStats) {
    addScore(item._id, item.likeCount * LIKE_SCORE);
  }

  for (const item of playlistStats) {
    addScore(item._id, item.playlistCount * PLAYLIST_SCORE);
  }

  /*
  |--------------------------------------------------------------------------
  | Sort globally
  |--------------------------------------------------------------------------
  */

  const rankedTrackIds = [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([trackId]) => trackId);

  /*
  |--------------------------------------------------------------------------
  | Make sure tracks still exist
  |--------------------------------------------------------------------------
  */

  if (rankedTrackIds.length > 0) {
    const rankedTracks = await getTracksByIds(
      rankedTrackIds.slice(0, safeLimit),
    );

    if (rankedTracks.length > 0) {
      return rankedTracks;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Cold-start fallback
  |--------------------------------------------------------------------------
  |
  | App bilkul new hai:
  |
  | no plays
  | no likes
  | no playlists
  |
  | then normal Discover catalog se tracks show karo.
  |
  */

  let fallbackTracks = await Track.find({
    isDiscoverable: true,
  })
    .sort({
      createdAt: -1,
    })
    .limit(safeLimit)
    .lean();

  /*
  |--------------------------------------------------------------------------
  | Nothing in DB yet
  |--------------------------------------------------------------------------
  */

  if (fallbackTracks.length === 0) {
    return discoverTracks({
      limit: safeLimit,

      offset: 0,

      isDiscoverable: true,
    });
  }

  const fallbackIds = fallbackTracks.map((track) => String(track._id));

  return getTracksByIds(fallbackIds);
};
