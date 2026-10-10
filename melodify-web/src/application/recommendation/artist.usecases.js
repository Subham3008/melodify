import { fetchArtistDetails } from "@/infrastructure/recommendation/artist.api";

import { createTrack } from "@/domain/track/track.entity";

export const getArtistDetails =
  async (
    artistId,
    limit = 20,
  ) => {
    const response =
      await fetchArtistDetails(
        artistId,
        limit,
      );

    const data =
      response?.data;

    if (
      !data?.artist ||
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