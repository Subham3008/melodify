import { apiClient } from "@/infrastructure/api/apiClient";

export const fetchMoreFromLikedArtist =
  async (
    limit = 6,
  ) => {
    const response =
      await apiClient.get(
        "/recommendations/more-from-liked-artist",
        {
          params: {
            limit,
          },
        },
      );

    return response.data;
  };