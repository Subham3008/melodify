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

  /*
  |--------------------------------------------------------------------------
  | Discover catalog flag
  |--------------------------------------------------------------------------
  |
  | true
  | → normal Discover Music section me show ho sakta hai
  |
  | false
  | → recommendation/search ke liye DB me available rahega
  |   but Discover Music me show nahi hoga
  |
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

    /*
    |--------------------------------------------------------------------------
    | Discover Music visibility
    |--------------------------------------------------------------------------
    |
    | Default false intentionally.
    |
    | Normal Discover fetch explicitly set karega:
    |
    | isDiscoverable = true
    |
    | Recommendation-only Jamendo fetch:
    |
    | isDiscoverable = false
    |
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
| Discover query index
|--------------------------------------------------------------------------
|
| Discover Music frequently filter karega:
|
| isDiscoverable: true
|
| Isliye index useful rahega.
|
*/

trackSchema.index({
  isDiscoverable: 1,
  lastSyncedAt: -1,
});

export const Track = mongoose.model<ITrack>("Track", trackSchema);
