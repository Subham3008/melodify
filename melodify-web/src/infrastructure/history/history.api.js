// Use the exact same apiClient import
// that you use in playlist.api.js
import { apiClient } from "@/infrastructure/api/apiClient";

export const createPlaybackEventRequest =
  async ({
    trackId,
    eventType,
    positionSeconds = 0,
  }) => {
    const response =
      await apiClient.post(
        "/history/events",
        {
          trackId,
          eventType,
          positionSeconds,
        },
      );

    return response.data;
  };

export const getRecentlyPlayedRequest =
  async (limit = 10) => {
    const response =
      await apiClient.get(
        "/history/recent",
        {
          params: {
            limit,
          },
        },
      );

    return response.data;
  };