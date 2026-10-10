import {
  getAlbumDetailsRequest,
} from "@/infrastructure/album/album.api";

import {
  createTrack,
} from "@/domain/track/track.entity";

export const getAlbumDetails =
  async (
    albumId,
  ) => {
    const response =
      await getAlbumDetailsRequest(
        albumId,
      );

    const data =
      response?.data;

    return {
      album:
        data?.album ??
        null,

      tracks:
        Array.isArray(
          data?.tracks,
        )
          ? data.tracks
            .map(
              createTrack,
            )
            .filter(
              Boolean,
            )
          : [],
    };
  };