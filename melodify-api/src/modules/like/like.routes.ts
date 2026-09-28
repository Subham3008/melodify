import { Router } from "express";

import { requireAuth } from "../../middleware/auth.middleware.js";

import { asyncHandler } from "../../utils/asyncHandler.js";

import {
  getLikedTracksController,
  likeTrackController,
  unlikeTrackController,
} from "./like.controller.js";

const router = Router();

/*
|--------------------------------------------------------------------------
| All like routes require authentication
|--------------------------------------------------------------------------
*/

router.use(requireAuth);

router.get("/", asyncHandler(getLikedTracksController));

router.post("/:trackId", asyncHandler(likeTrackController));

router.delete("/:trackId", asyncHandler(unlikeTrackController));

export default router;
