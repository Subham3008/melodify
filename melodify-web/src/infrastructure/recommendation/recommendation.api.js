import { apiClient } from "@/infrastructure/api/apiClient";

export const getRecommendationsRequest = async ({
  limit = 10,
} = {}) => {
  const response = await apiClient.get(
    "/recommendations",
    {
      params: {
        limit,
      },
    },
  );

  return response.data;
};