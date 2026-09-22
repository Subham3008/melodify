import { Router } from "express";

import {
  discoverTracksController,
  getTrackByIdController,
  getTracksController,
} from "./track.controller.js";

import { asyncHandler } from "../../utils/asyncHandler.js";

const router = Router();

router.get("/discover", asyncHandler(discoverTracksController));

router.get("/", asyncHandler(getTracksController));

router.get("/:id", asyncHandler(getTrackByIdController));

export default router;
