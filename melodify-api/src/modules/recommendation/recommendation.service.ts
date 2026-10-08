import mongoose from "mongoose";

import {
  PlaybackEvent,
  type PlaybackEventType,
} from "../history/history.model.js";

import { Track } from "../track/track.model.js";

import { discoverTracks, getTracksByIds } from "../track/track.service.js";

import type { TrackDTO } from "../track/track.types.js";

import { logger } from "../../utils/logger.js";

import {
  RecommendationProfile,
  type IArtistAffinity,
  type ITrackAffinity,
} from "./recommendationProfile.model.js";

const MAX_EVENTS_TO_ANALYZE = 500;

const MAX_PREFERRED_ARTISTS = 10;

const MAX_JAMENDO_ARTISTS_TO_REFRESH = 5;

const JAMENDO_TRACKS_PER_ARTIST = 20;

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

export const rebuildRecommendationProfile = async (
  userId: string,
): Promise<void> => {
  if (!mongoose.isValidObjectId(userId)) {
    return;
  }

  const events = await PlaybackEvent.find({
    userId,
  })
    .sort({
      createdAt: -1,
    })
    .limit(MAX_EVENTS_TO_ANALYZE)
    .lean();

  if (events.length === 0) {
    await RecommendationProfile.deleteOne({
      userId,
    });

    return;
  }

  const trackIds = [...new Set(events.map((event) => String(event.trackId)))];

  const tracks = await Track.find({
    _id: {
      $in: trackIds,
    },
  }).lean();

  const trackMap = new Map(tracks.map((track) => [String(track._id), track]));

  const artistAffinities = new Map<
    string,
    {
      artistId: string;
      artistName: string;

      score: number;

      playCount: number;
      completedCount: number;
      skippedCount: number;

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

      lastListenedAt: Date;
    }
  >();

  for (const event of events) {
    const track = trackMap.get(String(event.trackId));

    if (!track) {
      continue;
    }

    const scoreDelta = getEventScore(
      event.eventType,

      event.positionSeconds,

      track.durationSeconds,
    );

    const listenedAt = event.createdAt;

    const artistAffinity = artistAffinities.get(track.artistId) ?? {
      artistId: track.artistId,

      artistName: track.artistName,

      score: 0,

      playCount: 0,

      completedCount: 0,

      skippedCount: 0,

      lastListenedAt: listenedAt,
    };

    artistAffinity.score += scoreDelta;

    artistAffinity.playCount += event.eventType === "PLAYED" ? 1 : 0;

    artistAffinity.completedCount += event.eventType === "COMPLETED" ? 1 : 0;

    artistAffinity.skippedCount += event.eventType === "SKIPPED" ? 1 : 0;

    if (listenedAt > artistAffinity.lastListenedAt) {
      artistAffinity.lastListenedAt = listenedAt;
    }

    artistAffinities.set(track.artistId, artistAffinity);

    const trackKey = String(track._id);

    const trackAffinity = trackAffinities.get(trackKey) ?? {
      trackId: track._id,

      score: 0,

      playCount: 0,

      completedCount: 0,

      skippedCount: 0,

      lastListenedAt: listenedAt,
    };

    trackAffinity.score += scoreDelta;

    trackAffinity.playCount += event.eventType === "PLAYED" ? 1 : 0;

    trackAffinity.completedCount += event.eventType === "COMPLETED" ? 1 : 0;

    trackAffinity.skippedCount += event.eventType === "SKIPPED" ? 1 : 0;

    if (listenedAt > trackAffinity.lastListenedAt) {
      trackAffinity.lastListenedAt = listenedAt;
    }

    trackAffinities.set(trackKey, trackAffinity);
  }

  const artists = [...artistAffinities.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, 50);

  const profileTracks = [...trackAffinities.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, 200);

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

  const excludedTrackIds = [...recentTrackIds, ...negativeTrackIds];

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
  |
  | MongoDB me enough recommendations nahi hain:
  |
  | 1. user's top artists lo
  | 2. Jamendo se un artist ke fresh tracks fetch karo
  | 3. discoverTracks() automatically DB me upsert karega
  | 4. DB se candidates dubara read karo
  |
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
        /*
        | Jamendo fail hone se recommendation
        | endpoint completely fail nahi hona chahiye.
        |
        | Existing DB recommendations still
        | return kar sakte hain.
        */

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
      | Jamendo tracks DB me save hone ke
      | baad candidates dubara check karo.
      */

      candidates = await findRecommendationCandidates(
        preferredArtistIds,

        excludedTrackIds,
      );

      /*
      | Enough recommendations mil gayi,
      | extra Jamendo requests mat karo.
      */

      if (candidates.length >= safeLimit) {
        break;
      }
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Ranking
  |--------------------------------------------------------------------------
  */

  const artistScoreMap = new Map<string, number>(
    positiveArtists.map((artist) => [artist.artistId, artist.score]),
  );

  const rankedTrackIds = candidates
    .map((track) => ({
      track,

      score: artistScoreMap.get(track.artistId) ?? 0,
    }))
    .sort((a, b) => {
      /*
        | First preference:
        | user affinity score
        */

      if (b.score !== a.score) {
        return b.score - a.score;
      }

      /*
        | Second preference:
        | freshest synchronized track
        */

      return b.track.lastSyncedAt.getTime() - a.track.lastSyncedAt.getTime();
    })
    .slice(0, safeLimit)
    .map(({ track }) => String(track._id));

  return getTracksByIds(rankedTrackIds);
};
