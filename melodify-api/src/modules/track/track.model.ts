import mongoose, { Schema } from "mongoose";

export interface ITrack {
  source: "jamendo" | "s3";

  externalId: string;

  title: string;

  artistId: string;

  artistName: string;

  albumId: string | null;

  albumName: string | null;

  durationSeconds: number;

  imageUrl: string;

  streamUrl: string;

  licenseUrl: string | null;

  downloadAllowed: boolean;

  /*
  |--------------------------------------------------------------------------
  | Internal storage metadata
  |--------------------------------------------------------------------------
  |
  | Jamendo tracks:
  | null
  |
  | S3 tracks:
  | S3 object key
  |
  */

  audioStorageKey: string | null;

  imageStorageKey: string | null;

  /*
  |--------------------------------------------------------------------------
  | Audio processing / HLS
  |--------------------------------------------------------------------------
  |
  | uploaded
  | → original audio uploaded to S3
  |
  | processing
  | → FFmpeg worker is generating HLS
  |
  | ready
  | → HLS master playlist is available
  |
  | failed
  | → processing failed
  |
  */

  processingStatus: "uploaded" | "processing" | "ready" | "failed";

  /*
  |--------------------------------------------------------------------------
  | HLS master playlist key
  |--------------------------------------------------------------------------
  |
  | Example:
  |
  | tracks/hls/TRACK_ID/master.m3u8
  |
  */

  hlsMasterStorageKey: string | null;

  /*
  |--------------------------------------------------------------------------
  | Processing error
  |--------------------------------------------------------------------------
  |
  | null when there is no processing error.
  |
  */

  processingError: string | null;

  /*
  |--------------------------------------------------------------------------
  | Discover catalog flag
  |--------------------------------------------------------------------------
  */

  isDiscoverable: boolean;

  lastSyncedAt: Date;

  createdAt: Date;

  updatedAt: Date;
}

const trackSchema = new Schema<ITrack>(
  {
    source: {
      type: String,

      enum: ["jamendo", "s3"],

      required: true,

      default: "jamendo",
    },

    externalId: {
      type: String,

      required: true,
    },

    title: {
      type: String,

      required: true,

      trim: true,
    },

    artistId: {
      type: String,

      required: true,
    },

    artistName: {
      type: String,

      required: true,

      trim: true,
    },

    albumId: {
      type: String,

      default: null,
    },

    albumName: {
      type: String,

      default: null,
    },

    durationSeconds: {
      type: Number,

      required: true,
    },

    imageUrl: {
      type: String,

      default: "",
    },

    streamUrl: {
      type: String,

      default: "",
    },

    licenseUrl: {
      type: String,

      default: null,
    },

    downloadAllowed: {
      type: Boolean,

      default: false,
    },

    /*
      |--------------------------------------------------------------------------
      | Internal S3 object keys
      |--------------------------------------------------------------------------
      */

    audioStorageKey: {
      type: String,

      default: null,
    },

    imageStorageKey: {
      type: String,

      default: null,
    },

    /*
      |--------------------------------------------------------------------------
      | Audio processing status
      |--------------------------------------------------------------------------
      */

    processingStatus: {
      type: String,

      enum: ["uploaded", "processing", "ready", "failed"],

      default: "uploaded",
    },

    /*
      |--------------------------------------------------------------------------
      | HLS master playlist
      |--------------------------------------------------------------------------
      */

    hlsMasterStorageKey: {
      type: String,

      default: null,
    },

    /*
      |--------------------------------------------------------------------------
      | Processing failure information
      |--------------------------------------------------------------------------
      */

    processingError: {
      type: String,

      default: null,
    },

    /*
      |--------------------------------------------------------------------------
      | Discover visibility
      |--------------------------------------------------------------------------
      */

    isDiscoverable: {
      type: Boolean,

      default: false,

      index: true,
    },

    lastSyncedAt: {
      type: Date,

      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

/*
|--------------------------------------------------------------------------
| Unique source + external track ID
|--------------------------------------------------------------------------
*/

trackSchema.index(
  {
    source: 1,

    externalId: 1,
  },
  {
    unique: true,
  },
);

/*
|--------------------------------------------------------------------------
| Discover catalog index
|--------------------------------------------------------------------------
*/

trackSchema.index({
  isDiscoverable: 1,

  lastSyncedAt: -1,
});

export const Track = mongoose.model<ITrack>("Track", trackSchema);
