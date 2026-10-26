import crypto from "node:crypto";

import { Track } from "../track/track.model.js";

import { ApiError } from "../../utils/ApiError.js";

import { uploadAdminFile } from "./admin-storage.service.js";

import { enqueueAudioProcessing } from "../../queues/audio-processing.queue.js";

interface CreateAdminTrackInput {
  title: string;

  artistName: string;

  albumName?: string;

  durationSeconds: number;

  audioFile: Express.Multer.File;

  /*
  |--------------------------------------------------------------------------
  | Cover source
  |--------------------------------------------------------------------------
  |
  | Admin can provide:
  |
  | 1. coverFile
  | OR
  | 2. imageUrl
  |
  | At least one is required.
  |
  */

  coverFile?: Express.Multer.File;

  imageUrl?: string;
}

const createSlug = (value: string): string => {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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
    |
    | At least one required:
    |
    | coverFile
    | OR
    | imageUrl
    |
    */

  if (!input.coverFile && !input.imageUrl) {
    throw new ApiError(400, "Either cover file or imageUrl is required");
  }

  /*
    |--------------------------------------------------------------------------
    | Upload audio to S3
    |--------------------------------------------------------------------------
    */

  const audioStorageKey = await uploadAdminFile(input.audioFile, "audio");

  /*
    |--------------------------------------------------------------------------
    | Resolve cover
    |--------------------------------------------------------------------------
    |
    | Priority:
    |
    | coverFile > imageUrl
    |
    | If cover file exists:
    | → upload cover to S3
    |
    | If only imageUrl exists:
    | → save external URL directly
    |
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
    | Create MongoDB track
    |--------------------------------------------------------------------------
    |
    | NOTE:
    |
    | For an uploaded S3 cover:
    |
    | imageStorageKey contains the private S3 object key.
    | imageUrl remains empty for now.
    |
    | Later:
    | S3/CloudFront media delivery will generate the actual image URL.
    |
    | For an external cover:
    |
    | imageUrl contains the external URL.
    | imageStorageKey is null.
    |
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
