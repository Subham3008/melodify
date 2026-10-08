import { createTrack } from "@/domain/track/track.entity";

import { getRecommendationsRequest } from "@/infrastructure/recommendation/recommendation.api";

export const getRecommendedTracks = async ({
  limit = 10,
} = {}) => {
  const data =
    await getRecommendationsRequest({
      limit,
    });

  return data.data
    .map(createTrack)
    .filter(Boolean);
};