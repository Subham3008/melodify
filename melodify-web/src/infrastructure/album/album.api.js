import {
  apiClient,
} from "@/infrastructure/api/apiClient";

export const getAlbumDetailsRequest =
  async (
    albumId,
  ) => {
    const response =
      await apiClient.get(
        `/tracks/albums/${albumId}`,
      );

    return response.data;
  };