import {
  apiClient,
} from "@/infrastructure/api/apiClient";

export const searchAllRequest =
  async ({
    query,
    page = 1,
    trackLimit = 20,
    artistLimit = 6,
  }) => {
    const response =
      await apiClient.get(
        "/tracks/search",
        {
          params: {
            q:
              query,

            page,

            trackLimit,

            artistLimit,
          },
        },
      );

    return response.data;
  };