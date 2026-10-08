import { Router } from "express";

import { requireAuth } from "../../middleware/auth.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getRecommendationsController } from "./recommendation.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/", asyncHandler(getRecommendationsController));

export default router;
