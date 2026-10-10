import { apiClient } from "@/infrastructure/api/apiClient";

export const fetchArtistDetails =
  async (
    artistId,
    limit = 20,
  ) => {
    const response =
      await apiClient.get(
        `/recommendations/artists/${artistId}`,
        {
          params: {
            limit,
          },
        },
      );

    return response.data;
  };