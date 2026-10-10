import { apiClient } from "@/infrastructure/api/apiClient";

export const fetchPopularTracks =
  async (
    limit = 10,
  ) => {
    const response =
      await apiClient.get(
        "/recommendations/popular",
        {
          params: {
            limit,
          },
        },
      );

    return response.data;
  };