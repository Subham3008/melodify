import { Router } from "express";

import { requireAuth } from "../../middleware/auth.middleware.js";

import { validateBody } from "../../middleware/validate.middleware.js";

import { asyncHandler } from "../../utils/asyncHandler.js";

import {
  createPlaylistSchema,
  renamePlaylistSchema,
} from "./playlist.validation.js";

import {
  addTrackController,
  createPlaylistController,
  renamePlaylistController,
  deletePlaylistController,
  getPlaylistController,
  getPlaylistsController,
  removeTrackController,
} from "./playlist.controller.js";

const router = Router();

/*
|--------------------------------------------------------------------------
| Every playlist route is private
|--------------------------------------------------------------------------
*/

router.use(requireAuth);

router.post(
  "/",

  validateBody(createPlaylistSchema),

  asyncHandler(createPlaylistController),
);

router.get(
  "/",

  asyncHandler(getPlaylistsController),
);

router.get(
  "/:playlistId",

  asyncHandler(getPlaylistController),
);

router.patch(
  "/:playlistId",

  validateBody(renamePlaylistSchema),

  asyncHandler(renamePlaylistController),
);

router.delete(
  "/:playlistId",

  asyncHandler(deletePlaylistController),
);

router.post(
  "/:playlistId/tracks/:trackId",

  asyncHandler(addTrackController),
);

router.delete(
  "/:playlistId/tracks/:trackId",

  asyncHandler(removeTrackController),
);

export default router;
