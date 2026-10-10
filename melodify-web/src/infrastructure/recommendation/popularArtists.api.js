import { apiClient } from "@/infrastructure/api/apiClient";

export const fetchPopularArtists =
  async (
    limit = 6,
  ) => {
    const response =
      await apiClient.get(
        "/recommendations/popular-artists",
        {
          params: {
            limit,
          },
        },
      );

    return response.data;
  };