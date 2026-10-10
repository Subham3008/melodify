import { Router } from "express";

import { requireAuth } from "../../middleware/auth.middleware.js";

import { asyncHandler } from "../../utils/asyncHandler.js";

import {
  getRecommendationsController,
  getBecauseYouListenedToController,
} from "./recommendation.controller.js";

const router = Router();

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
|
| Is router ke saare recommendation endpoints protected hain.
|
*/

router.use(requireAuth);

/*
|--------------------------------------------------------------------------
| Because You Listened To
|--------------------------------------------------------------------------
|
| Important:
| Specific route ko "/" se pehle rakhna cleaner hai.
|
*/

router.get(
  "/because-you-listened",
  asyncHandler(getBecauseYouListenedToController),
);

/*
|--------------------------------------------------------------------------
| Recommended For You
|--------------------------------------------------------------------------
*/

router.get("/", asyncHandler(getRecommendationsController));

export default router;
