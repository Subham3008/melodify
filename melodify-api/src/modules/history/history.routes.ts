import { Router } from "express";

import { requireAuth } from "../../middleware/auth.middleware.js";

import { validateBody } from "../../middleware/validate.middleware.js";

import { asyncHandler } from "../../utils/asyncHandler.js";

import { createPlaybackEventSchema } from "./history.validation.js";

import {
  createPlaybackEventController,
  getRecentlyPlayedController,
} from "./history.controller.js";

const router = Router();

/*
|--------------------------------------------------------------------------
| All history routes require login
|--------------------------------------------------------------------------
*/

router.use(requireAuth);

/*
|--------------------------------------------------------------------------
| POST /api/v1/history/events
|--------------------------------------------------------------------------
*/

router.post(
  "/events",

  validateBody(createPlaybackEventSchema),

  asyncHandler(createPlaybackEventController),
);

/*
|--------------------------------------------------------------------------
| GET /api/v1/history/recent
|--------------------------------------------------------------------------
*/

router.get(
  "/recent",

  asyncHandler(getRecentlyPlayedController),
);

export default router;
