import { apiClient } from "@/infrastructure/api/apiClient";

export const fetchBecauseYouListenedTo =
  async (
    limit = 6,
  ) => {
    const response =
      await apiClient.get(
        "/recommendations/because-you-listened",
        {
          params: {
            limit,
          },
        },
      );

    return response.data;
  };