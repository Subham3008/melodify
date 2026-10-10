import { Router } from "express";

import { requireAuth } from "../../middleware/auth.middleware.js";

import { asyncHandler } from "../../utils/asyncHandler.js";

import {
  getRecommendationsController,
  getBecauseYouListenedToController,
  getMoreFromLikedArtistController,
  getPopularTracksController,
  getPopularArtistsController,
  getArtistDetailsController,
} from "./recommendation.controller.js";

const router = Router();

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/

router.use(requireAuth);

/*
|--------------------------------------------------------------------------
| Global popularity
|--------------------------------------------------------------------------
*/

router.get(
  "/popular",

  asyncHandler(getPopularTracksController),
);

router.get(
  "/popular-artists",

  asyncHandler(getPopularArtistsController),
);

/*
|--------------------------------------------------------------------------
| Artist page
|--------------------------------------------------------------------------
*/

router.get(
  "/artists/:artistId",

  asyncHandler(getArtistDetailsController),
);

/*
|--------------------------------------------------------------------------
| Personalized recommendations
|--------------------------------------------------------------------------
*/

router.get(
  "/because-you-listened",

  asyncHandler(getBecauseYouListenedToController),
);

router.get(
  "/more-from-liked-artist",

  asyncHandler(getMoreFromLikedArtistController),
);

/*
|--------------------------------------------------------------------------
| Recommended For You
|--------------------------------------------------------------------------
*/

router.get(
  "/",

  asyncHandler(getRecommendationsController),
);

export default router;
