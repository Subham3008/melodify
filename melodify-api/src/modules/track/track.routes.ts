import { Router } from "express";

import {
  discoverTracksController,
  getTrackByIdController,
  getTracksController,
  searchTracksAndArtistsController,
} from "./track.controller.js";

import { asyncHandler } from "../../utils/asyncHandler.js";

const router = Router();

router.get("/discover", asyncHandler(discoverTracksController));

/*
|--------------------------------------------------------------------------
| Universal search
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| /search must stay before /:id.
|
*/

router.get("/search", asyncHandler(searchTracksAndArtistsController));

router.get("/", asyncHandler(getTracksController));

router.get("/:id", asyncHandler(getTrackByIdController));

export default router;
