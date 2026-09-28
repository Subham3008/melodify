import mongoose, { Schema, Types } from "mongoose";

export interface ILike {
  userId: Types.ObjectId;
  trackId: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const likeSchema = new Schema<ILike>(
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
  },
  {
    timestamps: true,
  },
);

/*
|--------------------------------------------------------------------------
| Prevent duplicate likes
|--------------------------------------------------------------------------
|
| Same user same track ko multiple baar like nahi kar sakta.
|
*/

likeSchema.index(
  {
    userId: 1,
    trackId: 1,
  },
  {
    unique: true,
  },
);

export const Like = mongoose.model<ILike>("Like", likeSchema);
