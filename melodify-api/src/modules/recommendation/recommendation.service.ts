import mongoose from "mongoose";

import {
  PlaybackEvent,
  type PlaybackEventType,
} from "../history/history.model.js";

import { Track } from "../track/track.model.js";

import {
  RecommendationProfile,
  type IArtistAffinity,
  type ITrackAffinity,
} from "./recommendationProfile.model.js";

import { getTracksByIds } from "../track/track.service.js";
import type { TrackDTO } from "../track/track.types.js";

const MAX_EVENTS_TO_ANALYZE = 500;

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

  const artistAffinities = new Map();

  const trackAffinities = new Map();

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

  const positiveArtists = (profile.artists as IArtistAffinity[])
    .filter((artist) => artist.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  if (positiveArtists.length === 0) {
    return [];
  }

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

  const negativeTrackIds = (profile.tracks as ITrackAffinity[])
    .filter((track) => track.score < 0)
    .map((track) => track.trackId);

  const artistScoreMap = new Map(
    positiveArtists.map((artist) => [artist.artistId, artist.score]),
  );

  const candidates = await Track.find({
    artistId: {
      $in: positiveArtists.map((artist) => artist.artistId),
    },

    _id: {
      $nin: [...recentTrackIds, ...negativeTrackIds],
    },
  })
    .limit(150)
    .lean();

  const rankedTrackIds = candidates
    .map((track) => ({
      track,

      score: artistScoreMap.get(track.artistId) ?? 0,
    }))
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return b.track.lastSyncedAt.getTime() - a.track.lastSyncedAt.getTime();
    })
    .slice(0, safeLimit)
    .map(({ track }) => String(track._id));

  return getTracksByIds(rankedTrackIds);
};
