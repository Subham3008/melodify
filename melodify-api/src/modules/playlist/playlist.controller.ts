import type { Request, Response } from "express";

import { ApiError } from "../../utils/ApiError.js";

import {
  addTrackToPlaylist,
  createPlaylist,
  deletePlaylist,
  getPlaylistById,
  getUserPlaylists,
  removeTrackFromPlaylist,
} from "./playlist.service.js";

export const createPlaylistController = async (
  req: Request<
    {},
    {},
    {
      name: string;
      description?: string;
    }
  >,

  res: Response,
): Promise<void> => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const playlist = await createPlaylist(userId, req.body);

  res.status(201).json({
    success: true,

    message: "Playlist created",

    data: playlist,
  });
};

export const getPlaylistsController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const playlists = await getUserPlaylists(userId);

  res.status(200).json({
    success: true,

    count: playlists.length,

    data: playlists,
  });
};

export const getPlaylistController = async (
  req: Request<{
    playlistId: string;
  }>,

  res: Response,
): Promise<void> => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const playlist = await getPlaylistById(
    userId,

    req.params.playlistId,
  );

  res.status(200).json({
    success: true,

    data: playlist,
  });
};

export const addTrackController = async (
  req: Request<{
    playlistId: string;
    trackId: string;
  }>,

  res: Response,
): Promise<void> => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const result = await addTrackToPlaylist(
    userId,

    req.params.playlistId,

    req.params.trackId,
  );

  res.status(200).json({
    success: true,

    message: result.added
      ? "Track added to playlist"
      : "Track already exists in playlist",

    data: result,
  });
};

export const removeTrackController = async (
  req: Request<{
    playlistId: string;
    trackId: string;
  }>,

  res: Response,
): Promise<void> => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const result = await removeTrackFromPlaylist(
    userId,

    req.params.playlistId,

    req.params.trackId,
  );

  res.status(200).json({
    success: true,

    message: "Track removed from playlist",

    data: result,
  });
};

export const deletePlaylistController = async (
  req: Request<{
    playlistId: string;
  }>,

  res: Response,
): Promise<void> => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  await deletePlaylist(
    userId,

    req.params.playlistId,
  );

  res.status(200).json({
    success: true,

    message: "Playlist deleted",
  });
};
