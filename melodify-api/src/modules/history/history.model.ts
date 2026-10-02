import mongoose, { Schema } from "mongoose";

export const PLAYBACK_EVENT_TYPES = ["PLAYED", "COMPLETED", "SKIPPED"] as const;

export type PlaybackEventType = (typeof PLAYBACK_EVENT_TYPES)[number];

const playbackEventSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    trackId: {
      type: Schema.Types.ObjectId,
      ref: "Track",
      required: true,
    },

    eventType: {
      type: String,
      enum: PLAYBACK_EVENT_TYPES,
      required: true,
    },

    positionSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

/*
|--------------------------------------------------------------------------
| Indexes
|--------------------------------------------------------------------------
|
| Recently played:
| userId + newest events
|
*/

playbackEventSchema.index({
  userId: 1,
  createdAt: -1,
});

playbackEventSchema.index({
  userId: 1,
  trackId: 1,
  createdAt: -1,
});

export const PlaybackEvent =
  mongoose.models.PlaybackEvent ||
  mongoose.model("PlaybackEvent", playbackEventSchema);
