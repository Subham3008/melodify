import { Router } from "express";

import {
  discoverTracksController,
  getTrackByIdController,
  getTracksController,
  searchTracksAndArtistsController,
} from "./track.controller.js";

import { getAlbumDetailsController } from "./album.controller.js";

import { asyncHandler } from "../../utils/asyncHandler.js";

const router = Router();

/*
|--------------------------------------------------------------------------
| Discover
|--------------------------------------------------------------------------
*/

router.get("/discover", asyncHandler(discoverTracksController));

/*
|--------------------------------------------------------------------------
| Universal search
|--------------------------------------------------------------------------
*/

router.get("/search", asyncHandler(searchTracksAndArtistsController));

/*
|--------------------------------------------------------------------------
| Album details
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| Must stay BEFORE /:id.
|
| Otherwise Express could interpret:
|
| /albums/123
|
| incorrectly through generic routes.
|
*/

router.get("/albums/:albumId", asyncHandler(getAlbumDetailsController));

/*
|--------------------------------------------------------------------------
| Tracks
|--------------------------------------------------------------------------
*/

router.get("/", asyncHandler(getTracksController));

router.get("/:id", asyncHandler(getTrackByIdController));

export default router;
