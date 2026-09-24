import { apiClient } from "@/infrastructure/api/apiClient";

export const getTracksRequest = async ({
  page = 1,
  limit = 20,
  search = "",
} = {}) => {
  const params = {
    page,
    limit,
  };

  if (search.trim()) {
    params.search = search.trim();
  }

  const response = await apiClient.get(
    "/tracks",
    {
      params,
    },
  );

  return response.data;
};

export const getTrackByIdRequest = async (
  trackId,
) => {
  const response = await apiClient.get(
    `/tracks/${trackId}`,
  );

  return response.data;
};