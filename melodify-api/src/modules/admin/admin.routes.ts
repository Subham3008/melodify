import { Router } from "express";

import { requireAdmin, requireAuth } from "../../middleware/auth.middleware.js";

import {
  adminTestController,
  createAdminTrackController,
  deleteAdminTrackController,
  getAdminTrackProcessingStatusController,
  listAdminTracksController,
  retryAdminTrackProcessingController,
  updateAdminTrackController,
  updateAdminTrackDiscoverabilityController,
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
| Admin uploaded tracks
|--------------------------------------------------------------------------
*/

router.get(
  "/tracks",

  requireAuth,

  requireAdmin,

  listAdminTracksController,
);

/*
|--------------------------------------------------------------------------
| Processing status
|--------------------------------------------------------------------------
*/

router.get(
  "/tracks/:id/status",

  requireAuth,

  requireAdmin,

  getAdminTrackProcessingStatusController,
);

/*
|--------------------------------------------------------------------------
| Retry failed processing
|--------------------------------------------------------------------------
*/

router.post(
  "/tracks/:id/retry",

  requireAuth,

  requireAdmin,

  retryAdminTrackProcessingController,
);

/*
|--------------------------------------------------------------------------
| Update uploaded track metadata
|--------------------------------------------------------------------------
*/

router.patch(
  "/tracks/:id",

  requireAuth,

  requireAdmin,

  adminTrackUpload.single("cover"),

  updateAdminTrackController,
);

/*
|--------------------------------------------------------------------------
| Show / hide track from Discover
|--------------------------------------------------------------------------
*/

router.patch(
  "/tracks/:id/discoverability",

  requireAuth,

  requireAdmin,

  updateAdminTrackDiscoverabilityController,
);

/*
|--------------------------------------------------------------------------
| Delete uploaded track
|--------------------------------------------------------------------------
*/

router.delete(
  "/tracks/:id",

  requireAuth,

  requireAdmin,

  deleteAdminTrackController,
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
