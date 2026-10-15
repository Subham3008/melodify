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

    audioStorageKey: {
      type: String,
      default: null,
    },

    imageStorageKey: {
      type: String,
      default: null,
    },

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

trackSchema.index(
  {
    source: 1,
    externalId: 1,
  },
  {
    unique: true,
  },
);

trackSchema.index({
  isDiscoverable: 1,
  lastSyncedAt: -1,
});

export const Track = mongoose.model<ITrack>("Track", trackSchema);
