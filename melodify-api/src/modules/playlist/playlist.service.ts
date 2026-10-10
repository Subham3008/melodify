import mongoose, { Types } from "mongoose";

import { Playlist } from "./playlist.model.js";

import { Track } from "../track/track.model.js";

import { getTracksByIds } from "../track/track.service.js";

import { ApiError } from "../../utils/ApiError.js";

import { enqueueRecommendationRefresh } from "../../queues/recommendation.queue.js";

interface CreatePlaylistInput {
  name: string;
  description?: string;
}

export const createPlaylist = async (
  userId: string,
  input: CreatePlaylistInput,
) => {
  const playlist = await Playlist.create({
    userId,

    name: input.name,

    description: input.description || "",

    tracks: [],
  });

  return {
    id: String(playlist._id),

    name: playlist.name,

    description: playlist.description,

    trackCount: 0,

    createdAt: playlist.createdAt,

    updatedAt: playlist.updatedAt,
  };
};

export const getUserPlaylists = async (userId: string) => {
  const playlists = await Playlist.find({
    userId,
  }).sort({
    createdAt: -1,
  });

  return playlists.map((playlist) => ({
    id: String(playlist._id),

    name: playlist.name,

    description: playlist.description,

    trackCount: playlist.tracks.length,

    createdAt: playlist.createdAt,

    updatedAt: playlist.updatedAt,
  }));
};

export const getPlaylistById = async (userId: string, playlistId: string) => {
  if (!mongoose.isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist id");
  }

  const playlist = await Playlist.findOne({
    _id: playlistId,
    userId,
  });

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  const trackIds = playlist.tracks.map((item) => String(item.trackId));

  const tracks = await getTracksByIds(trackIds);

  return {
    id: String(playlist._id),

    name: playlist.name,

    description: playlist.description,

    trackCount: tracks.length,

    tracks,

    createdAt: playlist.createdAt,

    updatedAt: playlist.updatedAt,
  };
};

export const addTrackToPlaylist = async (
  userId: string,
  playlistId: string,
  trackId: string,
) => {
  if (!mongoose.isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist id");
  }

  if (!mongoose.isValidObjectId(trackId)) {
    throw new ApiError(400, "Invalid track id");
  }

  /*
   |--------------------------------------------------------------------------
   | Verify playlist ownership
   |--------------------------------------------------------------------------
   */

  const playlistExists = await Playlist.exists({
    _id: playlistId,
    userId,
  });

  if (!playlistExists) {
    throw new ApiError(404, "Playlist not found");
  }

  /*
   |--------------------------------------------------------------------------
   | Verify track
   |--------------------------------------------------------------------------
   */

  const trackExists = await Track.exists({
    _id: trackId,
  });

  if (!trackExists) {
    throw new ApiError(404, "Track not found");
  }

  /*
   |--------------------------------------------------------------------------
   | Atomic add
   |--------------------------------------------------------------------------
   |
   | tracks.trackId != trackId
   |
   | means:
   | same track dubara add nahi hoga.
   |
   */

  const result = await Playlist.updateOne(
    {
      _id: playlistId,
      userId,

      "tracks.trackId": {
        $ne: new Types.ObjectId(trackId),
      },
    },

    {
      $push: {
        tracks: {
          trackId: new Types.ObjectId(trackId),

          addedAt: new Date(),
        },
      },
    },
  );

  const added = result.modifiedCount > 0;

  /*
   |--------------------------------------------------------------------------
   | Recommendation refresh
   |--------------------------------------------------------------------------
   |
   | Playlist add is a positive recommendation signal.
   |
   | Only enqueue when track was actually added.
   |
   */

  if (added) {
    await enqueueRecommendationRefresh({
      userId,
      playlistId,
      trackId,
      reason: "PLAYLIST_TRACK_ADDED",
    });
  }

  return {
    playlistId,
    trackId,

    added,
  };
};

export const removeTrackFromPlaylist = async (
  userId: string,
  playlistId: string,
  trackId: string,
) => {
  if (
    !mongoose.isValidObjectId(playlistId) ||
    !mongoose.isValidObjectId(trackId)
  ) {
    throw new ApiError(400, "Invalid playlist or track id");
  }

  const playlist = await Playlist.findOne({
    _id: playlistId,
    userId,
  });

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  const result = await Playlist.updateOne(
    {
      _id: playlistId,
      userId,
    },

    {
      $pull: {
        tracks: {
          trackId: new Types.ObjectId(trackId),
        },
      },
    },
  );

  const removed = result.modifiedCount > 0;

  /*
     |--------------------------------------------------------------------------
     | Recommendation refresh
     |--------------------------------------------------------------------------
     |
     | Only enqueue when a track was
     | actually removed.
     |
     */

  if (removed) {
    await enqueueRecommendationRefresh({
      userId,
      playlistId,
      trackId,
      reason: "PLAYLIST_TRACK_REMOVED",
    });
  }

  return {
    playlistId,
    trackId,

    removed,
  };
};

export const renamePlaylist = async (
  userId: string,
  playlistId: string,
  name: string,
) => {
  if (!mongoose.isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist id");
  }

  const playlist = await Playlist.findOneAndUpdate(
    {
      _id: playlistId,
      userId,
    },

    {
      $set: {
        name: name.trim(),
      },
    },

    {
      new: true,
    },
  );

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  return {
    id: String(playlist._id),

    name: playlist.name,

    description: playlist.description,

    trackCount: playlist.tracks.length,

    createdAt: playlist.createdAt,

    updatedAt: playlist.updatedAt,
  };
};

export const deletePlaylist = async (userId: string, playlistId: string) => {
  if (!mongoose.isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist id");
  }

  const playlist = await Playlist.findOneAndDelete({
    _id: playlistId,
    userId,
  });

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  /*
   |--------------------------------------------------------------------------
   | Recommendation refresh
   |--------------------------------------------------------------------------
   |
   | Agar deleted playlist me tracks the,
   | to unke playlist signals recommendation
   | profile se remove hone chahiye.
   |
   */

  if (playlist.tracks.length > 0) {
    await enqueueRecommendationRefresh({
      userId,
      playlistId,
      reason: "PLAYLIST_DELETED",
    });
  }
};
