import type { Request, Response } from "express";

import { ApiError } from "../../utils/ApiError.js";

import {
  createAdminTrack,
  deleteAdminTrack,
  getAdminTrackProcessingStatus,
  listAdminTracks,
  retryAdminTrackProcessing,
  updateAdminTrack,
  updateAdminTrackDiscoverability,
} from "./admin-track.service.js";

/*
|--------------------------------------------------------------------------
| Admin test
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
| List uploaded tracks
|--------------------------------------------------------------------------
*/

export const listAdminTracksController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const page = Number(req.query.page ?? 1);

  const limit = Number(req.query.limit ?? 20);

  const status =
    typeof req.query.status === "string" ? req.query.status : undefined;

  const result = await listAdminTracks({
    page,

    limit,

    status,
  });

  res.status(200).json({
    success: true,

    data: result,
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

  if (!audioFile) {
    throw new ApiError(400, "Audio file is required");
  }

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
| Processing status
|--------------------------------------------------------------------------
*/

export const getAdminTrackProcessingStatusController = async (
  req: Request<{
    id: string;
  }>,
  res: Response,
): Promise<void> => {
  const result = await getAdminTrackProcessingStatus(req.params.id);

  res.status(200).json({
    success: true,

    data: result,
  });
};

/*
|--------------------------------------------------------------------------
| Retry processing
|--------------------------------------------------------------------------
*/

export const retryAdminTrackProcessingController = async (
  req: Request<{
    id: string;
  }>,
  res: Response,
): Promise<void> => {
  const result = await retryAdminTrackProcessing(req.params.id);

  res.status(200).json({
    success: true,

    message: "Track processing queued again",

    data: result,
  });
};

/*
|--------------------------------------------------------------------------
| Delete track
|--------------------------------------------------------------------------
*/

export const deleteAdminTrackController = async (
  req: Request<{
    id: string;
  }>,
  res: Response,
): Promise<void> => {
  const result = await deleteAdminTrack(req.params.id);

  res.status(200).json({
    success: true,

    message: "Track deleted successfully",

    data: result,
  });
};

/*
|--------------------------------------------------------------------------
| Update track metadata
|--------------------------------------------------------------------------
*/

export const updateAdminTrackController = async (
  req: Request<{
    id: string;
  }>,
  res: Response,
): Promise<void> => {
  const coverFile = req.file;

  const title = String(req.body.title ?? "");

  const artistName = String(req.body.artistName ?? "");

  const albumName =
    req.body.albumName !== undefined ? String(req.body.albumName) : undefined;

  /*
    |--------------------------------------------------------------------------
    | imageUrl is OPTIONAL
    |--------------------------------------------------------------------------
    |
    | Missing imageUrl:
    | → keep current cover
    |
    | Non-empty imageUrl:
    | → replace current cover with external URL
    |
    */

  const imageUrl =
    req.body.imageUrl !== undefined ? String(req.body.imageUrl) : undefined;

  const track = await updateAdminTrack(req.params.id, {
    title,

    artistName,

    albumName,

    coverFile,

    imageUrl,
  });

  res.status(200).json({
    success: true,

    message: "Track updated successfully",

    data: track,
  });
};

/*
|--------------------------------------------------------------------------
| Update discoverability
|--------------------------------------------------------------------------
*/

export const updateAdminTrackDiscoverabilityController = async (
  req: Request<{
    id: string;
  }>,
  res: Response,
): Promise<void> => {
  const { isDiscoverable } = req.body;

  if (typeof isDiscoverable !== "boolean") {
    throw new ApiError(400, "isDiscoverable must be a boolean");
  }

  const result = await updateAdminTrackDiscoverability(
    req.params.id,

    isDiscoverable,
  );

  res.status(200).json({
    success: true,

    message: isDiscoverable
      ? "Track is now visible in Discover"
      : "Track hidden from Discover",

    data: result,
  });
};
