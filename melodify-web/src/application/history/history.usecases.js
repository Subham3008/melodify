import {
  createPlaybackEventRequest,
  getRecentlyPlayedRequest,
} from "@/infrastructure/history/history.api";

export const sendPlaybackEvent =
  async ({
    trackId,
    eventType,
    positionSeconds = 0,
  }) => {
    const response =
      await createPlaybackEventRequest({
        trackId,
        eventType,
        positionSeconds,
      });

    return response.data;
  };

export const getRecentlyPlayedTracks =
  async (limit = 10) => {
    const response =
      await getRecentlyPlayedRequest(
        limit,
      );

    return response.data;
  };