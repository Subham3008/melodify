import { fetchBecauseYouListenedTo } from "@/infrastructure/recommendation/becauseYouListened.api";

import { createTrack } from "@/domain/track/track.entity";

export const getBecauseYouListenedTo =
  async (
    limit = 6,
  ) => {
    const response =
      await fetchBecauseYouListenedTo(
        limit,
      );

    const data =
      response?.data;

    if (
      !data ||
      !data.seedTrack ||
      !Array.isArray(
        data.tracks,
      )
    ) {
      return null;
    }

    return {
      seedTrack:
        createTrack(
          data.seedTrack,
        ),

      tracks:
        data.tracks.map(
          createTrack,
        ),
    };
  };