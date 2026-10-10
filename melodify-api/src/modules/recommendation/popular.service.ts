import { PlaybackEvent } from "../history/history.model.js";
import { Like } from "../like/like.model.js";
import { Playlist } from "../playlist/playlist.model.js";
import { Track } from "../track/track.model.js";

import { discoverTracks, getTracksByIds } from "../track/track.service.js";

import {
  fetchJamendoArtistById,
  type JamendoArtist,
} from "../track/jamendo.service.js";

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
| Popular artist DTO
|--------------------------------------------------------------------------
*/

export interface PopularArtist {
  artistId: string;

  artistName: string;

  imageUrl: string;

  score: number;
}

/*
|--------------------------------------------------------------------------
| Build global track popularity scores
|--------------------------------------------------------------------------
|
| Shared between:
|
| Popular tracks
| Popular artists
|
*/

const buildGlobalTrackScores = async (): Promise<Map<string, number>> => {
  /*
    |--------------------------------------------------------------------------
    | Playback window
    |--------------------------------------------------------------------------
    */

  const since = new Date();

  since.setDate(since.getDate() - 30);

  /*
    |--------------------------------------------------------------------------
    | Playback
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
    | Likes
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
    | Playlist usage
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
    | Merge track scores
    |--------------------------------------------------------------------------
    */

  const scores = new Map<string, number>();

  const addScore = (
    trackId: unknown,

    score: number,
  ) => {
    const id = String(trackId);

    scores.set(
      id,

      (scores.get(id) ?? 0) + score,
    );
  };

  for (const item of playbackStats) {
    addScore(
      item._id,

      item.playedCount * PLAYED_SCORE + item.completedCount * COMPLETED_SCORE,
    );
  }

  for (const item of likeStats) {
    addScore(
      item._id,

      item.likeCount * LIKE_SCORE,
    );
  }

  for (const item of playlistStats) {
    addScore(
      item._id,

      item.playlistCount * PLAYLIST_SCORE,
    );
  }

  return scores;
};

/*
|--------------------------------------------------------------------------
| Popular on Melodify
|--------------------------------------------------------------------------
*/

export const getPopularTracks = async (limit = 10): Promise<TrackDTO[]> => {
  const safeLimit = Math.min(
    Math.max(limit, 1),

    20,
  );

  const scores = await buildGlobalTrackScores();

  const rankedTrackIds = [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([trackId]) => trackId);

  /*
    |--------------------------------------------------------------------------
    | Ranking available
    |--------------------------------------------------------------------------
    */

  if (rankedTrackIds.length > 0) {
    const rankedTracks = await getTracksByIds(
      rankedTrackIds.slice(
        0,

        safeLimit,
      ),
    );

    if (rankedTracks.length > 0) {
      return rankedTracks;
    }
  }

  /*
    |--------------------------------------------------------------------------
    | Cold-start fallback
    |--------------------------------------------------------------------------
    */

  const fallbackTracks = await Track.find({
    isDiscoverable: true,
  })
    .sort({
      createdAt: -1,
    })
    .limit(safeLimit)
    .lean();

  /*
    |--------------------------------------------------------------------------
    | Completely empty DB
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

/*
|--------------------------------------------------------------------------
| Popular Artists
|--------------------------------------------------------------------------
|
| Track popularity scores ko artist level par combine karte hain.
|
| Example:
|
| Artist A:
|
| Song 1 = 20
| Song 2 = 15
| Song 3 = 10
|
| Artist total = 45
|
*/

export const getPopularArtists = async (
  limit = 6,
): Promise<PopularArtist[]> => {
  const safeLimit = Math.min(
    Math.max(limit, 1),

    10,
  );

  const scores = await buildGlobalTrackScores();

  /*
    |--------------------------------------------------------------------------
    | Cold-start
    |--------------------------------------------------------------------------
    |
    | Agar app me abhi engagement nahi hai,
    | Discover catalog artists use karenge.
    |
    */

  if (scores.size === 0) {
    let tracks = await Track.find({
      isDiscoverable: true,
    })
      .sort({
        createdAt: -1,
      })
      .limit(100)
      .select("artistId artistName")
      .lean();

    if (tracks.length === 0) {
      await discoverTracks({
        limit: 50,

        offset: 0,

        isDiscoverable: true,
      });

      tracks = await Track.find({
        isDiscoverable: true,
      })
        .sort({
          createdAt: -1,
        })
        .limit(100)
        .select("artistId artistName")
        .lean();
    }

    const uniqueArtists = new Map<string, string>();

    for (const track of tracks) {
      if (!uniqueArtists.has(track.artistId)) {
        uniqueArtists.set(
          track.artistId,

          track.artistName,
        );
      }
    }

    const selectedArtists = [...uniqueArtists.entries()].slice(
      0,

      safeLimit,
    );

    const results = await Promise.all(
      selectedArtists.map(async ([artistId, artistName]) => {
        try {
          const artist = await fetchJamendoArtistById(artistId);

          return {
            artistId,

            artistName: artist?.artistName || artistName,

            imageUrl: artist?.imageUrl || "",

            score: 0,
          };
        } catch {
          return {
            artistId,

            artistName,

            imageUrl: "",

            score: 0,
          };
        }
      }),
    );

    return results;
  }

  /*
    |--------------------------------------------------------------------------
    | Fetch DB tracks participating in ranking
    |--------------------------------------------------------------------------
    */

  const trackIds = [...scores.keys()];

  const tracks = await Track.find({
    _id: {
      $in: trackIds,
    },
  })
    .select("_id artistId artistName")
    .lean();

  /*
    |--------------------------------------------------------------------------
    | Sum track score → artist score
    |--------------------------------------------------------------------------
    */

  const artists = new Map<
    string,
    {
      artistId: string;

      artistName: string;

      score: number;
    }
  >();

  for (const track of tracks) {
    const trackScore = scores.get(String(track._id)) ?? 0;

    const existing = artists.get(track.artistId);

    if (existing) {
      existing.score += trackScore;

      continue;
    }

    artists.set(track.artistId, {
      artistId: track.artistId,

      artistName: track.artistName,

      score: trackScore,
    });
  }

  /*
    |--------------------------------------------------------------------------
    | Top artists
    |--------------------------------------------------------------------------
    */

  const topArtists = [...artists.values()]
    .sort((a, b) => b.score - a.score)
    .slice(
      0,

      safeLimit,
    );

  /*
    |--------------------------------------------------------------------------
    | Get Jamendo artist images
    |--------------------------------------------------------------------------
    */

  const results = await Promise.all(
    topArtists.map(async (artist): Promise<PopularArtist> => {
      try {
        const jamendoArtist: JamendoArtist | null =
          await fetchJamendoArtistById(artist.artistId);

        return {
          artistId: artist.artistId,

          artistName: jamendoArtist?.artistName || artist.artistName,

          imageUrl: jamendoArtist?.imageUrl || "",

          score: artist.score,
        };
      } catch {
        /*
              |--------------------------------------------------------------------------
              | Artist API failure shouldn't break entire Home page
              |--------------------------------------------------------------------------
              */

        return {
          artistId: artist.artistId,

          artistName: artist.artistName,

          imageUrl: "",

          score: artist.score,
        };
      }
    }),
  );

  return results;
};
