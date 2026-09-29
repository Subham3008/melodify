import {
  apiClient,
} from "@/infrastructure/api/apiClient";

export const createPlaylistRequest =
  async (
    payload,
  ) => {
    const response =
      await apiClient.post(
        "/playlists",
        payload,
      );

    return response.data;
  };

export const getPlaylistsRequest =
  async () => {
    const response =
      await apiClient.get(
        "/playlists",
      );

    return response.data;
  };

export const getPlaylistRequest =
  async (
    playlistId,
  ) => {
    const response =
      await apiClient.get(
        `/playlists/${playlistId}`,
      );

    return response.data;
  };

export const deletePlaylistRequest =
  async (
    playlistId,
  ) => {
    const response =
      await apiClient.delete(
        `/playlists/${playlistId}`,
      );

    return response.data;
  };

export const addTrackToPlaylistRequest =
  async (
    playlistId,
    trackId,
  ) => {
    const response =
      await apiClient.post(
        `/playlists/${playlistId}/tracks/${trackId}`,
      );

    return response.data;
  };

export const removeTrackFromPlaylistRequest =
  async (
    playlistId,
    trackId,
  ) => {
    const response =
      await apiClient.delete(
        `/playlists/${playlistId}/tracks/${trackId}`,
      );

    return response.data;
  };