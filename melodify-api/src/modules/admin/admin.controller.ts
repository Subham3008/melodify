import type { Request, Response } from "express";

import { ApiError } from "../../utils/ApiError.js";

import {
  createAdminTrack,
  getAdminTrackProcessingStatus,
} from "./admin-track.service.js";

/*
|--------------------------------------------------------------------------
| Temporary admin test
|--------------------------------------------------------------------------
*/

export const adminTestController = (req: Request, res: Response): void => {
  res.status(200).json({
    success: true,

    message: "Admin access granted",

    user: {
      userId: req.user?.userId,

      role: req.user?.role,
    },
  });
};

/*
|--------------------------------------------------------------------------
| Upload track
|--------------------------------------------------------------------------
*/

export const createAdminTrackController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const files = req.files as
    | {
        [fieldname: string]: Express.Multer.File[];
      }
    | undefined;

  const audioFile = files?.audio?.[0];

  const coverFile = files?.cover?.[0];

  /*
    |--------------------------------------------------------------------------
    | Audio required
    |--------------------------------------------------------------------------
    */

  if (!audioFile) {
    throw new ApiError(400, "Audio file is required");
  }

  /*
    |--------------------------------------------------------------------------
    | Cover file OR imageUrl
    |--------------------------------------------------------------------------
    */

  const imageUrl = String(req.body.imageUrl ?? "").trim();

  if (!coverFile && !imageUrl) {
    throw new ApiError(400, "Either cover file or imageUrl is required");
  }

  const { title, artistName, albumName, durationSeconds } = req.body;

  const parsedDuration = Number(durationSeconds);

  const track = await createAdminTrack({
    title: String(title ?? ""),

    artistName: String(artistName ?? ""),

    albumName: albumName ? String(albumName) : undefined,

    durationSeconds: parsedDuration,

    audioFile,

    coverFile,

    imageUrl: imageUrl || undefined,
  });

  res.status(201).json({
    success: true,

    message: "Track uploaded successfully",

    data: {
      id: track._id,

      title: track.title,

      artistName: track.artistName,

      albumName: track.albumName,

      source: track.source,

      imageUrl: track.imageUrl,

      processingStatus: track.processingStatus,

      isDiscoverable: track.isDiscoverable,
    },
  });
};

/*
|--------------------------------------------------------------------------
| Track processing status
|--------------------------------------------------------------------------
*/

export const getAdminTrackProcessingStatusController = async (
  req: Request<{
    id: string;
  }>,
  res: Response,
): Promise<void> => {
  const status = await getAdminTrackProcessingStatus(req.params.id);

  res.status(200).json({
    success: true,

    data: status,
  });
};
