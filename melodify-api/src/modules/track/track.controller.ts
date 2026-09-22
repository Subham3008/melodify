import type { Request, Response } from "express";

import { discoverTracks, getTrackById, getTracks } from "./track.service.js";

export const discoverTracksController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const limit = Number(req.query.limit) || 20;

  const offset = Number(req.query.offset) || 0;

  const search =
    typeof req.query.search === "string" ? req.query.search : undefined;

  const tracks = await discoverTracks({
    limit,
    offset,
    search,
  });

  res.status(200).json({
    success: true,

    count: tracks.length,

    data: tracks,
  });
};

export const getTracksController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const page = Number(req.query.page) || 1;

  const limit = Number(req.query.limit) || 20;

  const search =
    typeof req.query.search === "string" ? req.query.search : undefined;

  const tracks = await getTracks({
    page,
    limit,
    search,
  });

  res.status(200).json({
    success: true,

    count: tracks.length,

    data: tracks,
  });
};

export const getTrackByIdController = async (
  req: Request<{ id: string }>,
  res: Response,
): Promise<void> => {
  const track = await getTrackById(req.params.id);

  res.status(200).json({
    success: true,

    data: track,
  });
};
