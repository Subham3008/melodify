import mongoose, { Schema, Types } from "mongoose";

export interface IArtistAffinity {
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

export interface ITrackAffinity {
  trackId: Types.ObjectId;

  score: number;

  playCount: number;
  completedCount: number;
  skippedCount: number;

  liked: boolean;
  playlistCount: number;

  lastListenedAt: Date;
}

export interface IRecommendationProfile {
  userId: Types.ObjectId;

  artists: IArtistAffinity[];

  tracks: ITrackAffinity[];

  lastProcessedEventAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

const artistAffinitySchema = new Schema<IArtistAffinity>(
  {
    artistId: {
      type: String,
      required: true,
    },

    artistName: {
      type: String,
      required: true,
    },

    score: {
      type: Number,
      default: 0,
    },

    playCount: {
      type: Number,
      default: 0,
    },

    completedCount: {
      type: Number,
      default: 0,
    },

    skippedCount: {
      type: Number,
      default: 0,
    },

    lastListenedAt: {
      type: Date,
      required: true,
    },

    likedTrackCount: {
      type: Number,
      default: 0,
    },

    playlistTrackCount: {
      type: Number,
      default: 0,
    },
  },

  {
    _id: false,
  },
);

const trackAffinitySchema = new Schema<ITrackAffinity>(
  {
    trackId: {
      type: Schema.Types.ObjectId,
      ref: "Track",
      required: true,
    },

    score: {
      type: Number,
      default: 0,
    },

    playCount: {
      type: Number,
      default: 0,
    },

    completedCount: {
      type: Number,
      default: 0,
    },

    skippedCount: {
      type: Number,
      default: 0,
    },

    lastListenedAt: {
      type: Date,
      required: true,
    },

    liked: {
      type: Boolean,
      default: false,
    },

    playlistCount: {
      type: Number,
      default: 0,
    },
  },

  {
    _id: false,
  },
);

const recommendationProfileSchema = new Schema<IRecommendationProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",

      required: true,

      unique: true,
      index: true,
    },

    artists: {
      type: [artistAffinitySchema],

      default: [],
    },

    tracks: {
      type: [trackAffinitySchema],

      default: [],
    },

    lastProcessedEventAt: {
      type: Date,

      default: null,
    },
  },

  {
    timestamps: true,
  },
);

export const RecommendationProfile =
  mongoose.models.RecommendationProfile ||
  mongoose.model<IRecommendationProfile>(
    "RecommendationProfile",

    recommendationProfileSchema,
  );
