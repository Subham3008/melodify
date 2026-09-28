import {
  createTrack,
} from "@/domain/track/track.entity";

import {
  getLikedTracksRequest,
  likeTrackRequest,
  unlikeTrackRequest,
} from "@/infrastructure/like/like.api";

export const getUserLikedTracks =
  async () => {
    const response =
      await getLikedTracksRequest();

    return response.data
      .map(createTrack)
      .filter(Boolean);
  };

export const likeUserTrack =
  async (
    trackId,
  ) => {
    return likeTrackRequest(
      trackId,
    );
  };

export const unlikeUserTrack =
  async (
    trackId,
  ) => {
    return unlikeTrackRequest(
      trackId,
    );
  };