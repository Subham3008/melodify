import { fetchMoreFromLikedArtist } from "@/infrastructure/recommendation/moreFromLikedArtist.api";

import { createTrack } from "@/domain/track/track.entity";

export const getMoreFromLikedArtist =
  async (
    limit = 6,
  ) => {
    const response =
      await fetchMoreFromLikedArtist(
        limit,
      );

    const data =
      response?.data;

    if (
      !data ||
      !data.artist ||
      !Array.isArray(
        data.tracks,
      )
    ) {
      return null;
    }

    return {
      artist:
        data.artist,

      tracks:
        data.tracks.map(
          createTrack,
        ),
    };
  };