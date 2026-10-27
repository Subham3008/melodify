import { Router } from "express";

import { requireAuth, requireAdmin } from "../../middleware/auth.middleware.js";

import {
  adminTestController,
  createAdminTrackController,
  getAdminTrackProcessingStatusController,
} from "./admin.controller.js";

import { adminTrackUpload } from "./admin-upload.middleware.js";

const router = Router();

/*
|--------------------------------------------------------------------------
| Admin test
|--------------------------------------------------------------------------
*/

router.get(
  "/test",

  requireAuth,

  requireAdmin,

  adminTestController,
);

/*
|--------------------------------------------------------------------------
| Track processing status
|--------------------------------------------------------------------------
|
| GET /api/v1/admin/tracks/:id/status
|
*/

router.get(
  "/tracks/:id/status",

  requireAuth,

  requireAdmin,

  getAdminTrackProcessingStatusController,
);

/*
|--------------------------------------------------------------------------
| Upload track
|--------------------------------------------------------------------------
*/

router.post(
  "/tracks",

  requireAuth,

  requireAdmin,

  adminTrackUpload.fields([
    {
      name: "audio",

      maxCount: 1,
    },

    {
      name: "cover",

      maxCount: 1,
    },
  ]),

  createAdminTrackController,
);

export default router;
