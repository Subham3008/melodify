import {
  searchAllRequest,
} from "@/infrastructure/search/search.api";

import {
  createTrack,
} from "@/domain/track/track.entity";

export const searchAll =
  async ({
    query,
    page = 1,
    trackLimit = 20,
    artistLimit = 6,
  }) => {
    const response =
      await searchAllRequest({
        query,

        page,

        trackLimit,

        artistLimit,
      });

    const data =
      response?.data;

    return {
      artists:
        Array.isArray(
          data?.artists,
        )
          ? data.artists
          : [],

      tracks:
        Array.isArray(
          data?.tracks,
        )
          ? data.tracks
            .map(
              createTrack,
            )
            .filter(Boolean)
          : [],
    };
  };