import { Router } from "express";

import { requireAuth, requireAdmin } from "../../middleware/auth.middleware.js";

import {
  adminTestController,
  createAdminTrackController,
} from "./admin.controller.js";

import { adminTrackUpload } from "./admin-upload.middleware.js";

const router = Router();

router.get(
  "/test",

  requireAuth,

  requireAdmin,

  adminTestController,
);

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
