import {
  apiClient,
} from "@/infrastructure/api/apiClient";

export const getLikedTracksRequest =
  async () => {
    const response =
      await apiClient.get(
        "/likes",
      );

    return response.data;
  };

export const likeTrackRequest =
  async (
    trackId,
  ) => {
    const response =
      await apiClient.post(
        `/likes/${trackId}`,
      );

    return response.data;
  };

export const unlikeTrackRequest =
  async (
    trackId,
  ) => {
    const response =
      await apiClient.delete(
        `/likes/${trackId}`,
      );

    return response.data;
  };