import mongoose from "mongoose";

import {
  PlaybackEvent,
  type PlaybackEventType,
} from "../history/history.model.js";

import { Track } from "../track/track.model.js";

import { discoverTracks, getTracksByIds } from "../track/track.service.js";

import type { TrackDTO } from "../track/track.types.js";

import { Like } from "../like/like.model.js";

import { Playlist } from "../playlist/playlist.model.js";

import { logger } from "../../utils/logger.js";

import {
  RecommendationProfile,
  type IArtistAffinity,
  type ITrackAffinity,
} from "./recommendationProfile.model.js";

/*
|--------------------------------------------------------------------------
| Recommendation constants
|--------------------------------------------------------------------------
*/

const MAX_EVENTS_TO_ANALYZE = 500;

const MAX_PREFERRED_ARTISTS = 10;

const MAX_JAMENDO_ARTISTS_TO_REFRESH = 5;

const JAMENDO_TRACKS_PER_ARTIST = 20;

/*
|--------------------------------------------------------------------------
| Recommendation signal scores
|--------------------------------------------------------------------------
|
| Listening:
|
| PLAYED            = +1
| COMPLETED         = +5
| SKIPPED early     = -3
| SKIPPED later     = -1
|
| Strong intent:
|
| LIKED             = +8
| PLAYLIST ADD      = +6
|
*/

const LIKE_SCORE = 8;

const PLAYLIST_SCORE = 6;

/*
|--------------------------------------------------------------------------
| Playback event scoring
|--------------------------------------------------------------------------
*/

const getEventScore = (
  eventType: PlaybackEventType,
  positionSeconds: number,
  durationSeconds: number,
): number => {
  const listenedRatio =
    durationSeconds > 0
      ? Math.min(Math.max(positionSeconds / durationSeconds, 0), 1)
      : 0;

  switch (eventType) {
    case "COMPLETED":
      return 5;

    case "SKIPPED":
      return listenedRatio < 0.2 ? -3 : -1;

    case "PLAYED":
    default:
      return 1;
  }
};

/*
|--------------------------------------------------------------------------
| Rebuild recommendation profile
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| Profile is rebuilt from CURRENT database state.
|
| We do NOT do:
|
| old score +8
| old score +6
| old score -8
|
| because BullMQ retries could double-count.
|
| Instead:
|
| playback events
| + current likes
| + current playlist tracks
| ↓
| rebuild profile from scratch
|
*/

export const rebuildRecommendationProfile = async (
  userId: string,
): Promise<void> => {
  if (!mongoose.isValidObjectId(userId)) {
    return;
  }

  /*
  |--------------------------------------------------------------------------
  | Fetch all recommendation signals
  |--------------------------------------------------------------------------
  */

  const [events, likes, playlists] = await Promise.all([
    PlaybackEvent.find({
      userId,
    })
      .sort({
        createdAt: -1,
      })
      .limit(MAX_EVENTS_TO_ANALYZE)
      .lean(),

    Like.find({
      userId,
    })
      .sort({
        createdAt: -1,
      })
      .select("trackId createdAt")
      .lean(),

    Playlist.find({
      userId,
    })
      .select("tracks")
      .lean(),
  ]);

  /*
  |--------------------------------------------------------------------------
  | Flatten playlist signals
  |--------------------------------------------------------------------------
  |
  | If same track exists in two playlists:
  |
  | playlistCount = 2
  | score = +12
  |
  | This is useful because adding a track to multiple playlists
  | represents stronger user intent.
  |
  */

  const playlistTrackSignals = playlists.flatMap((playlist) =>
    playlist.tracks.map((item) => ({
      trackId: item.trackId,
      addedAt: item.addedAt,
    })),
  );

  /*
  |--------------------------------------------------------------------------
  | No recommendation signals
  |--------------------------------------------------------------------------
  */

  const hasAnySignal =
    events.length > 0 || likes.length > 0 || playlistTrackSignals.length > 0;

  if (!hasAnySignal) {
    await RecommendationProfile.deleteOne({
      userId,
    });

    return;
  }

  /*
  |--------------------------------------------------------------------------
  | Collect every track participating in recommendations
  |--------------------------------------------------------------------------
  */

  const trackIds = [
    ...new Set([
      ...events.map((event) => String(event.trackId)),

      ...likes.map((like) => String(like.trackId)),

      ...playlistTrackSignals.map((item) => String(item.trackId)),
    ]),
  ];

  /*
  |--------------------------------------------------------------------------
  | Fetch track information
  |--------------------------------------------------------------------------
  */

  const tracks = await Track.find({
    _id: {
      $in: trackIds,
    },
  }).lean();

  const trackMap = new Map(tracks.map((track) => [String(track._id), track]));

  /*
  |--------------------------------------------------------------------------
  | Internal affinity maps
  |--------------------------------------------------------------------------
  */

  const artistAffinities = new Map<
    string,
    {
      artistId: string;

      artistName: string;

      score: number;

      playCount: number;

      completedCount: number;

      skippedCount: number;

      likedTrackCount: number;

      playlistTrackCount: number;

      lastListenedAt: Date;
    }
  >();

  const trackAffinities = new Map<
    string,
    {
      trackId: mongoose.Types.ObjectId;

      score: number;

      playCount: number;

      completedCount: number;

      skippedCount: number;

      liked: boolean;

      playlistCount: number;

      lastListenedAt: Date;
    }
  >();

  /*
  |--------------------------------------------------------------------------
  | Helper: get or create affinities
  |--------------------------------------------------------------------------
  */

  const getAffinities = (trackId: string, signalAt: Date) => {
    const track = trackMap.get(trackId);

    if (!track) {
      return null;
    }

    /*
    |--------------------------------------------------------------------------
    | Artist affinity
    |--------------------------------------------------------------------------
    */

    const artistAffinity = artistAffinities.get(track.artistId) ?? {
      artistId: track.artistId,

      artistName: track.artistName,

      score: 0,

      playCount: 0,

      completedCount: 0,

      skippedCount: 0,

      likedTrackCount: 0,

      playlistTrackCount: 0,

      lastListenedAt: signalAt,
    };

    /*
    |--------------------------------------------------------------------------
    | Track affinity
    |--------------------------------------------------------------------------
    */

    const trackKey = String(track._id);

    const trackAffinity = trackAffinities.get(trackKey) ?? {
      trackId: track._id,

      score: 0,

      playCount: 0,

      completedCount: 0,

      skippedCount: 0,

      liked: false,

      playlistCount: 0,

      lastListenedAt: signalAt,
    };

    /*
    |--------------------------------------------------------------------------
    | Latest activity timestamp
    |--------------------------------------------------------------------------
    */

    if (signalAt > artistAffinity.lastListenedAt) {
      artistAffinity.lastListenedAt = signalAt;
    }

    if (signalAt > trackAffinity.lastListenedAt) {
      trackAffinity.lastListenedAt = signalAt;
    }

    artistAffinities.set(track.artistId, artistAffinity);

    trackAffinities.set(trackKey, trackAffinity);

    return {
      track,

      artistAffinity,

      trackAffinity,
    };
  };

  /*
  |--------------------------------------------------------------------------
  | 1. Playback signals
  |--------------------------------------------------------------------------
  */

  for (const event of events) {
    const trackId = String(event.trackId);

    const track = trackMap.get(trackId);

    if (!track) {
      continue;
    }

    const affinities = getAffinities(trackId, event.createdAt);

    if (!affinities) {
      continue;
    }

    const scoreDelta = getEventScore(
      event.eventType,

      event.positionSeconds,

      track.durationSeconds,
    );

    /*
    |--------------------------------------------------------------------------
    | Artist score
    |--------------------------------------------------------------------------
    */

    affinities.artistAffinity.score += scoreDelta;

    affinities.artistAffinity.playCount += event.eventType === "PLAYED" ? 1 : 0;

    affinities.artistAffinity.completedCount +=
      event.eventType === "COMPLETED" ? 1 : 0;

    affinities.artistAffinity.skippedCount +=
      event.eventType === "SKIPPED" ? 1 : 0;

    /*
    |--------------------------------------------------------------------------
    | Track score
    |--------------------------------------------------------------------------
    */

    affinities.trackAffinity.score += scoreDelta;

    affinities.trackAffinity.playCount += event.eventType === "PLAYED" ? 1 : 0;

    affinities.trackAffinity.completedCount +=
      event.eventType === "COMPLETED" ? 1 : 0;

    affinities.trackAffinity.skippedCount +=
      event.eventType === "SKIPPED" ? 1 : 0;
  }

  /*
  |--------------------------------------------------------------------------
  | 2. Like signals
  |--------------------------------------------------------------------------
  */

  for (const like of likes) {
    const affinities = getAffinities(
      String(like.trackId),

      like.createdAt,
    );

    if (!affinities) {
      continue;
    }

    affinities.artistAffinity.score += LIKE_SCORE;

    affinities.artistAffinity.likedTrackCount += 1;

    affinities.trackAffinity.score += LIKE_SCORE;

    affinities.trackAffinity.liked = true;
  }

  /*
  |--------------------------------------------------------------------------
  | 3. Playlist signals
  |--------------------------------------------------------------------------
  */

  for (const item of playlistTrackSignals) {
    const affinities = getAffinities(
      String(item.trackId),

      item.addedAt,
    );

    if (!affinities) {
      continue;
    }

    affinities.artistAffinity.score += PLAYLIST_SCORE;

    affinities.artistAffinity.playlistTrackCount += 1;

    affinities.trackAffinity.score += PLAYLIST_SCORE;

    affinities.trackAffinity.playlistCount += 1;
  }

  /*
  |--------------------------------------------------------------------------
  | Sort artist affinities
  |--------------------------------------------------------------------------
  */

  const artists = [...artistAffinities.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, 50);

  /*
  |--------------------------------------------------------------------------
  | Sort track affinities
  |--------------------------------------------------------------------------
  */

  const profileTracks = [...trackAffinities.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, 200);

  /*
  |--------------------------------------------------------------------------
  | Save recommendation profile
  |--------------------------------------------------------------------------
  */

  await RecommendationProfile.findOneAndUpdate(
    {
      userId,
    },

    {
      $set: {
        artists,

        tracks: profileTracks,

        lastProcessedEventAt: new Date(),
      },

      $setOnInsert: {
        userId,
      },
    },

    {
      upsert: true,

      new: true,
    },
  );
};

/*
|--------------------------------------------------------------------------
| Find recommendation candidates
|--------------------------------------------------------------------------
*/

const findRecommendationCandidates = async (
  artistIds: string[],

  excludedTrackIds: mongoose.Types.ObjectId[],
) => {
  return Track.find({
    artistId: {
      $in: artistIds,
    },

    _id: {
      $nin: excludedTrackIds,
    },
  })
    .limit(200)
    .lean();
};

/*
|--------------------------------------------------------------------------
| Get personalized recommendations
|--------------------------------------------------------------------------
*/

export const getRecommendations = async (
  userId: string,
  limit = 10,
): Promise<TrackDTO[]> => {
  if (!mongoose.isValidObjectId(userId)) {
    return [];
  }

  const safeLimit = Math.min(Math.max(limit, 1), 20);

  const profile = await RecommendationProfile.findOne({
    userId,
  }).lean();

  if (!profile) {
    return [];
  }

  /*
  |--------------------------------------------------------------------------
  | Preferred artists
  |--------------------------------------------------------------------------
  */

  const positiveArtists = (profile.artists as IArtistAffinity[])
    .filter((artist) => artist.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_PREFERRED_ARTISTS);

  if (positiveArtists.length === 0) {
    return [];
  }

  /*
  |--------------------------------------------------------------------------
  | Recently played tracks
  |--------------------------------------------------------------------------
  */

  const recentEvents = await PlaybackEvent.find({
    userId,
  })
    .sort({
      createdAt: -1,
    })
    .limit(15)
    .select("trackId")
    .lean();

  const recentTrackIds = recentEvents.map((event) => event.trackId);

  /*
  |--------------------------------------------------------------------------
  | Negative tracks
  |--------------------------------------------------------------------------
  */

  const negativeTrackIds = (profile.tracks as ITrackAffinity[])
    .filter((track) => track.score < 0)
    .map((track) => track.trackId);

  /*
  |--------------------------------------------------------------------------
  | Excluded tracks
  |--------------------------------------------------------------------------
  */

  const excludedTrackIds = [...recentTrackIds, ...negativeTrackIds];

  /*
  |--------------------------------------------------------------------------
  | Preferred artist IDs
  |--------------------------------------------------------------------------
  */

  const preferredArtistIds = positiveArtists.map((artist) => artist.artistId);

  /*
  |--------------------------------------------------------------------------
  | First try MongoDB
  |--------------------------------------------------------------------------
  */

  let candidates = await findRecommendationCandidates(
    preferredArtistIds,

    excludedTrackIds,
  );

  /*
  |--------------------------------------------------------------------------
  | Jamendo fallback
  |--------------------------------------------------------------------------
  */

  if (candidates.length < safeLimit) {
    const artistsToRefresh = positiveArtists.slice(
      0,

      MAX_JAMENDO_ARTISTS_TO_REFRESH,
    );

    for (const artist of artistsToRefresh) {
      try {
        await discoverTracks({
          artistId: artist.artistId,

          limit: JAMENDO_TRACKS_PER_ARTIST,

          offset: 0,
        });
      } catch (error) {
        logger.warn(
          {
            err: error,

            userId,

            artistId: artist.artistId,
          },

          "Unable to refresh recommendation tracks from Jamendo",
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Read candidates again
      |--------------------------------------------------------------------------
      */

      candidates = await findRecommendationCandidates(
        preferredArtistIds,

        excludedTrackIds,
      );

      /*
      |--------------------------------------------------------------------------
      | Enough recommendations found
      |--------------------------------------------------------------------------
      */

      if (candidates.length >= safeLimit) {
        break;
      }
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Diversified ranking
  |--------------------------------------------------------------------------
  |
  | Problem:
  |
  | Agar top artist ke bahut saare tracks available hain,
  | to recommendation list same artist se fill ho sakti hai.
  |
  | Example:
  |
  | Artist A - Song 1
  | Artist A - Song 2
  | Artist A - Song 3
  | Artist A - Song 4
  |
  | Better:
  |
  | Artist A - Song 1
  | Artist B - Song 1
  | Artist C - Song 1
  | Artist A - Song 2
  |
  | Strategy:
  |
  | 1. Candidates artist-wise group karo
  | 2. Har artist ke tracks freshness ke according sort karo
  | 3. Preferred artist score order maintain karo
  | 4. Round-robin selection karo
  |
  */

  const candidatesByArtist = new Map<string, typeof candidates>();

  /*
  |--------------------------------------------------------------------------
  | Group tracks by artist
  |--------------------------------------------------------------------------
  */

  for (const track of candidates) {
    const artistTracks = candidatesByArtist.get(track.artistId) ?? [];

    artistTracks.push(track);

    candidatesByArtist.set(track.artistId, artistTracks);
  }

  /*
  |--------------------------------------------------------------------------
  | Fresh tracks first inside each artist
  |--------------------------------------------------------------------------
  */

  for (const artistTracks of candidatesByArtist.values()) {
    artistTracks.sort(
      (a, b) => b.lastSyncedAt.getTime() - a.lastSyncedAt.getTime(),
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Preferred artist order
  |--------------------------------------------------------------------------
  |
  | positiveArtists already:
  |
  | highest score
  | ↓
  | lowest score
  |
  | So we don't need artistScoreMap anymore.
  |
  */

  const preferredArtistOrder = positiveArtists.map((artist) => artist.artistId);

  /*
  |--------------------------------------------------------------------------
  | Round-robin diversified selection
  |--------------------------------------------------------------------------
  |
  | Example:
  |
  | A tracks:
  | A1 A2 A3
  |
  | B tracks:
  | B1 B2
  |
  | C tracks:
  | C1
  |
  | Result:
  |
  | A1 B1 C1 A2 B2 A3
  |
  */

  const diversifiedTracks: typeof candidates = [];

  let round = 0;

  while (diversifiedTracks.length < safeLimit) {
    let addedInThisRound = false;

    for (const artistId of preferredArtistOrder) {
      const artistTracks = candidatesByArtist.get(artistId);

      if (!artistTracks || artistTracks.length === 0) {
        continue;
      }

      const track = artistTracks[round];

      if (!track) {
        continue;
      }

      diversifiedTracks.push(track);

      addedInThisRound = true;

      if (diversifiedTracks.length >= safeLimit) {
        break;
      }
    }

    /*
    |--------------------------------------------------------------------------
    | No artist had a track for this round
    |--------------------------------------------------------------------------
    |
    | Means all available candidates are exhausted.
    |
    */

    if (!addedInThisRound) {
      break;
    }

    round += 1;
  }

  /*
  |--------------------------------------------------------------------------
  | Convert selected tracks to IDs
  |--------------------------------------------------------------------------
  */

  const rankedTrackIds = diversifiedTracks.map((track) => String(track._id));

  return getTracksByIds(rankedTrackIds);
};
