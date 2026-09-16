import { Router } from "express";

import {
  registerController,
  loginController,
  googleAuthController,
  refreshController,
  logoutController,
  meController,
} from "./auth.controller.js";

import {
  registerSchema,
  loginSchema,
  googleAuthSchema,
} from "./auth.validation.js";

import { validateBody } from "../../middleware/validate.middleware.js";

import { requireAuth } from "../../middleware/auth.middleware.js";

import { authLimiter } from "../../middleware/rateLimit.middleware.js";

import { asyncHandler } from "../../utils/asyncHandler.js";

const router = Router();

router.post(
  "/register",
  authLimiter,
  validateBody(registerSchema),
  asyncHandler(registerController),
);

router.post(
  "/login",
  authLimiter,
  validateBody(loginSchema),
  asyncHandler(loginController),
);

router.post(
  "/google",
  authLimiter,
  validateBody(googleAuthSchema),
  asyncHandler(googleAuthController),
);

router.post("/refresh", asyncHandler(refreshController));

router.post("/logout", asyncHandler(logoutController));

router.get("/me", requireAuth, asyncHandler(meController));

export default router;
