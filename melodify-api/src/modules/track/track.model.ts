import mongoose, { Schema } from "mongoose";

export interface ITrack {
  source: "jamendo";

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

  lastSyncedAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

const trackSchema = new Schema<ITrack>(
  {
    source: {
      type: String,
      enum: ["jamendo"],
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
      required: true,
    },

    streamUrl: {
      type: String,
      required: true,
    },

    licenseUrl: {
      type: String,
      default: null,
    },

    downloadAllowed: {
      type: Boolean,
      default: false,
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

export const Track = mongoose.model<ITrack>("Track", trackSchema);
