import mongoose, { Schema, Types } from "mongoose";

export interface IPlaylistTrack {
  trackId: Types.ObjectId;
  addedAt: Date;
}

export interface IPlaylist {
  userId: Types.ObjectId;

  name: string;

  description: string;

  tracks: IPlaylistTrack[];

  createdAt: Date;
  updatedAt: Date;
}

const playlistTrackSchema = new Schema<IPlaylistTrack>(
  {
    trackId: {
      type: Schema.Types.ObjectId,
      ref: "Track",
      required: true,
    },

    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  },
);

const playlistSchema = new Schema<IPlaylist>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },

    tracks: {
      type: [playlistTrackSchema],

      default: [],
    },
  },
  {
    timestamps: true,
  },
);

playlistSchema.index({
  userId: 1,
  createdAt: -1,
});

export const Playlist = mongoose.model<IPlaylist>("Playlist", playlistSchema);
