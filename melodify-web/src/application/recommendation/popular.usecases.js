import { fetchPopularTracks } from "@/infrastructure/recommendation/popular.api";

import { createTrack } from "@/domain/track/track.entity";

export const getPopularTracks =
  async (
    limit = 10,
  ) => {
    const response =
      await fetchPopularTracks(
        limit,
      );

    if (
      !Array.isArray(
        response?.data,
      )
    ) {
      return [];
    }

    return response.data.map(
      createTrack,
    );
  };