import crypto from "node:crypto";

import mongoose from "mongoose";

import { Track } from "../track/track.model.js";

import type { ITrack } from "../track/track.model.js";

import { Like } from "../like/like.model.js";

import { Playlist } from "../playlist/playlist.model.js";

import { PlaybackEvent } from "../history/history.model.js";

import { RecommendationProfile } from "../recommendation/recommendationProfile.model.js";

import { ApiError } from "../../utils/ApiError.js";

import {
  deleteAdminObject,
  deleteAdminPrefix,
  uploadAdminFile,
} from "./admin-storage.service.js";

import { enqueueAudioProcessing } from "../../queues/audio-processing.queue.js";

import { getCloudFrontMediaUrl } from "../track/cloudfront-media.service.js";

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

interface CreateAdminTrackInput {
  title: string;

  artistName: string;

  albumName?: string;

  durationSeconds: number;

  audioFile: Express.Multer.File;

  coverFile?: Express.Multer.File;

  imageUrl?: string;
}

interface ListAdminTracksInput {
  page?: number;

  limit?: number;

  status?: string;
}

/*
|--------------------------------------------------------------------------
| Processing status type
|--------------------------------------------------------------------------
|
| Directly Track model se type le rahe hain.
|
| Result:
|
| "uploaded"
| | "processing"
| | "ready"
| | "failed"
|
*/

type TrackProcessingStatus = ITrack["processingStatus"];

const PROCESSING_STATUSES: readonly TrackProcessingStatus[] = [
  "uploaded",
  "processing",
  "ready",
  "failed",
];

/*
|--------------------------------------------------------------------------
| Processing status type guard
|--------------------------------------------------------------------------
*/

const isTrackProcessingStatus = (
  value: string,
): value is TrackProcessingStatus => {
  return PROCESSING_STATUSES.includes(value as TrackProcessingStatus);
};

/*
|--------------------------------------------------------------------------
| Create slug
|--------------------------------------------------------------------------
*/

const createSlug = (value: string): string => {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

/*
|--------------------------------------------------------------------------
| Validate Mongo track ID
|--------------------------------------------------------------------------
*/

const validateTrackId = (trackId: string): void => {
  if (!mongoose.isValidObjectId(trackId)) {
    throw new ApiError(400, "Invalid track ID");
  }
};

/*
|--------------------------------------------------------------------------
| Validate external image URL
|--------------------------------------------------------------------------
*/

const validateImageUrl = (imageUrl: string): string => {
  try {
    const parsedUrl = new URL(imageUrl);

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      throw new Error("Invalid protocol");
    }

    return parsedUrl.toString();
  } catch {
    throw new ApiError(400, "imageUrl must be a valid http or https URL");
  }
};

/*
|--------------------------------------------------------------------------
| Create admin track
|--------------------------------------------------------------------------
*/

export const createAdminTrack = async (input: CreateAdminTrackInput) => {
  const title = input.title.trim();

  const artistName = input.artistName.trim();

  const albumName = input.albumName?.trim() || null;

  /*
    |--------------------------------------------------------------------------
    | Metadata validation
    |--------------------------------------------------------------------------
    */

  if (!title) {
    throw new ApiError(400, "Track title is required");
  }

  if (!artistName) {
    throw new ApiError(400, "Artist name is required");
  }

  if (!Number.isFinite(input.durationSeconds) || input.durationSeconds <= 0) {
    throw new ApiError(400, "Valid durationSeconds is required");
  }

  /*
    |--------------------------------------------------------------------------
    | Cover validation
    |--------------------------------------------------------------------------
    */

  if (!input.coverFile && !input.imageUrl) {
    throw new ApiError(400, "Either cover file or imageUrl is required");
  }

  /*
    |--------------------------------------------------------------------------
    | Upload original audio
    |--------------------------------------------------------------------------
    */

  const audioStorageKey = await uploadAdminFile(input.audioFile, "audio");

  /*
    |--------------------------------------------------------------------------
    | Resolve cover
    |--------------------------------------------------------------------------
    */

  let imageStorageKey: string | null = null;

  let finalImageUrl = "";

  if (input.coverFile) {
    imageStorageKey = await uploadAdminFile(input.coverFile, "covers");
  } else if (input.imageUrl) {
    finalImageUrl = validateImageUrl(input.imageUrl);
  }

  /*
    |--------------------------------------------------------------------------
    | Internal identifiers
    |--------------------------------------------------------------------------
    */

  const externalId = crypto.randomUUID();

  const artistId = `internal-artist-${createSlug(artistName)}`;

  const albumId = albumName
    ? `internal-album-${createSlug(artistName)}-${createSlug(albumName)}`
    : null;

  /*
    |--------------------------------------------------------------------------
    | Create Mongo track
    |--------------------------------------------------------------------------
    */

  const track = await Track.create({
    source: "s3",

    externalId,

    title,

    artistId,

    artistName,

    albumId,

    albumName,

    durationSeconds: Math.floor(input.durationSeconds),

    imageUrl: finalImageUrl,

    streamUrl: "",

    licenseUrl: null,

    downloadAllowed: false,

    audioStorageKey,

    imageStorageKey,

    isDiscoverable: true,

    processingStatus: "uploaded",

    hlsMasterStorageKey: null,

    processingError: null,

    lastSyncedAt: new Date(),
  });

  /*
    |--------------------------------------------------------------------------
    | Queue HLS processing
    |--------------------------------------------------------------------------
    */

  try {
    await enqueueAudioProcessing(String(track._id));
  } catch (error) {
    await Track.findByIdAndUpdate(track._id, {
      $set: {
        processingStatus: "failed",

        processingError: "Could not queue audio processing",
      },
    });

    throw error;
  }

  return track;
};

/*
|--------------------------------------------------------------------------
| List uploaded admin tracks
|--------------------------------------------------------------------------
*/

export const listAdminTracks = async ({
  page = 1,
  limit = 20,
  status,
}: ListAdminTracksInput) => {
  const safePage = Math.max(Math.floor(page), 1);

  const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 50);

  /*
    |--------------------------------------------------------------------------
    | Resolve typed processing status
    |--------------------------------------------------------------------------
    |
    | IMPORTANT FIX:
    |
    | Before:
    |
    | processingStatus?: string
    |
    | But mongoose expects:
    |
    | "uploaded"
    | | "processing"
    | | "ready"
    | | "failed"
    |
    */

  const processingStatus: TrackProcessingStatus | undefined =
    status && isTrackProcessingStatus(status) ? status : undefined;

  /*
    |--------------------------------------------------------------------------
    | Type-safe mongoose filter
    |--------------------------------------------------------------------------
    */

  const filter = processingStatus
    ? {
        source: "s3" as const,
        processingStatus,
      }
    : {
        source: "s3" as const,
      };

  /*
    |--------------------------------------------------------------------------
    | Fetch tracks + count
    |--------------------------------------------------------------------------
    */

  const [tracks, total] = await Promise.all([
    Track.find(filter)
      .sort({
        createdAt: -1,
      })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),

    Track.countDocuments(filter),
  ]);

  /*
    |--------------------------------------------------------------------------
    | Build response
    |--------------------------------------------------------------------------
    */

  const items = tracks.map((track) => {
    const imageUrl = track.imageStorageKey
      ? getCloudFrontMediaUrl(track.imageStorageKey)
      : track.imageUrl;

    const hlsUrl =
      track.processingStatus === "ready" && track.hlsMasterStorageKey
        ? getCloudFrontMediaUrl(track.hlsMasterStorageKey)
        : null;

    return {
      id: String(track._id),

      title: track.title,

      artistName: track.artistName,

      albumName: track.albumName,

      durationSeconds: track.durationSeconds,

      imageUrl,

      processingStatus: track.processingStatus,

      processingError: track.processingError,

      hlsUrl,

      isDiscoverable: track.isDiscoverable,

      createdAt: track.createdAt,
    };
  });

  return {
    items,

    pagination: {
      page: safePage,

      limit: safeLimit,

      total,

      totalPages: Math.max(Math.ceil(total / safeLimit), 1),
    },
  };
};

/*
|--------------------------------------------------------------------------
| Get admin track processing status
|--------------------------------------------------------------------------
*/

export const getAdminTrackProcessingStatus = async (trackId: string) => {
  validateTrackId(trackId);

  const track = await Track.findById(trackId).select(
    [
      "_id",

      "title",

      "source",

      "processingStatus",

      "processingError",

      "hlsMasterStorageKey",
    ].join(" "),
  );

  if (!track) {
    throw new ApiError(404, "Track not found");
  }

  if (track.source !== "s3") {
    throw new ApiError(
      400,
      "Processing status is only available for uploaded tracks",
    );
  }

  const hlsUrl =
    track.processingStatus === "ready" && track.hlsMasterStorageKey
      ? getCloudFrontMediaUrl(track.hlsMasterStorageKey)
      : null;

  return {
    id: String(track._id),

    title: track.title,

    processingStatus: track.processingStatus,

    processingError: track.processingError,

    hlsUrl,
  };
};

/*
|--------------------------------------------------------------------------
| Retry failed track processing
|--------------------------------------------------------------------------
*/

export const retryAdminTrackProcessing = async (trackId: string) => {
  validateTrackId(trackId);

  const track = await Track.findById(trackId);

  if (!track) {
    throw new ApiError(404, "Track not found");
  }

  if (track.source !== "s3") {
    throw new ApiError(400, "Only uploaded tracks can be retried");
  }

  /*
    |--------------------------------------------------------------------------
    | Only failed jobs can retry
    |--------------------------------------------------------------------------
    */

  if (track.processingStatus !== "failed") {
    throw new ApiError(409, "Only failed tracks can be retried");
  }

  /*
    |--------------------------------------------------------------------------
    | Original audio must still exist
    |--------------------------------------------------------------------------
    */

  if (!track.audioStorageKey) {
    throw new ApiError(400, "Original audio file is missing");
  }

  /*
    |--------------------------------------------------------------------------
    | Remove old / partial HLS files
    |--------------------------------------------------------------------------
    */

  await deleteAdminPrefix(`tracks/hls/${trackId}/`);

  /*
    |--------------------------------------------------------------------------
    | Reset processing state
    |--------------------------------------------------------------------------
    */

  await Track.findByIdAndUpdate(trackId, {
    $set: {
      processingStatus: "uploaded",

      processingError: null,

      hlsMasterStorageKey: null,
    },
  });

  /*
    |--------------------------------------------------------------------------
    | Queue again
    |--------------------------------------------------------------------------
    */

  try {
    await enqueueAudioProcessing(trackId);
  } catch (error) {
    await Track.findByIdAndUpdate(trackId, {
      $set: {
        processingStatus: "failed",

        processingError: "Could not queue audio processing",
      },
    });

    throw error;
  }

  return getAdminTrackProcessingStatus(trackId);
};

/*
|--------------------------------------------------------------------------
| Delete uploaded track
|--------------------------------------------------------------------------
*/

export const deleteAdminTrack = async (trackId: string) => {
  validateTrackId(trackId);

  /*
    |--------------------------------------------------------------------------
    | IMPORTANT
    |--------------------------------------------------------------------------
    |
    | lean() intentionally use kar rahe hain.
    |
    | Old/legacy Mongo documents me processingStatus field missing ho sakta hai.
    |
    | Normal findById() Mongoose default "uploaded" apply kar deta tha,
    | jiski wajah se legacy tracks ko incorrectly active processing maana
    | ja raha tha aur delete block ho raha tha.
    |
    */

  const track = await Track.findById(trackId).lean();

  if (!track) {
    throw new ApiError(404, "Track not found");
  }

  /*
    |--------------------------------------------------------------------------
    | Only internal uploaded tracks
    |--------------------------------------------------------------------------
    */

  if (track.source !== "s3") {
    throw new ApiError(
      400,
      "Only uploaded tracks can be deleted from admin management",
    );
  }

  /*
    |--------------------------------------------------------------------------
    | Protect genuinely active modern tracks
    |--------------------------------------------------------------------------
    |
    | Legacy track:
    |
    | processingStatus === undefined
    |
    | → deletion allowed
    |
    */

  if (
    track.processingStatus === "uploaded" ||
    track.processingStatus === "processing"
  ) {
    throw new ApiError(
      409,
      "Track cannot be deleted while audio processing is active",
    );
  }

  /*
    |--------------------------------------------------------------------------
    | Delete S3 files
    |--------------------------------------------------------------------------
    */

  await Promise.all([
    deleteAdminObject(track.audioStorageKey),

    deleteAdminObject(track.imageStorageKey),

    deleteAdminPrefix(`tracks/hls/${trackId}/`),
  ]);

  /*
    |--------------------------------------------------------------------------
    | Remove likes
    |--------------------------------------------------------------------------
    */

  await Like.deleteMany({
    trackId: track._id,
  });

  /*
    |--------------------------------------------------------------------------
    | Remove listening history
    |--------------------------------------------------------------------------
    */

  await PlaybackEvent.deleteMany({
    trackId: track._id,
  });

  /*
    |--------------------------------------------------------------------------
    | Remove from playlists
    |--------------------------------------------------------------------------
    */

  await Playlist.updateMany(
    {
      "tracks.trackId": track._id,
    },
    {
      $pull: {
        tracks: {
          trackId: track._id,
        },
      },
    },
  );

  /*
    |--------------------------------------------------------------------------
    | Remove from recommendation profiles
    |--------------------------------------------------------------------------
    */

  await RecommendationProfile.updateMany(
    {
      "tracks.trackId": track._id,
    },
    {
      $pull: {
        tracks: {
          trackId: track._id,
        },
      },
    },
  );

  /*
    |--------------------------------------------------------------------------
    | Delete track document
    |--------------------------------------------------------------------------
    */

  await Track.deleteOne({
    _id: track._id,
  });

  return {
    id: trackId,
  };
};
