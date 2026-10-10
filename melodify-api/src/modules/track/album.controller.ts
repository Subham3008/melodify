import type { Request, Response } from "express";

import { ApiError } from "../../utils/ApiError.js";

import { getAlbumDetails } from "./album.service.js";

/*
|--------------------------------------------------------------------------
| Get album details
|--------------------------------------------------------------------------
*/

export const getAlbumDetailsController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const albumIdParam = req.params.albumId;

  const albumId = Array.isArray(albumIdParam) ? albumIdParam[0] : albumIdParam;

  if (!albumId) {
    throw new ApiError(400, "Album id is required");
  }

  const requestedLimit = Number(req.query.limit ?? 50);

  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(Math.floor(requestedLimit), 1), 100)
    : 50;

  const result = await getAlbumDetails(albumId, limit);

  res.status(200).json({
    success: true,

    count: result.tracks.length,

    data: {
      album: result.album,

      tracks: result.tracks,
    },
  });
};
