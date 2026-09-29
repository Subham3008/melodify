import {
  createTrack,
} from "@/domain/track/track.entity";

export const createPlaylistSummary =
  (playlist) => {
    if (!playlist) {
      return null;
    }

    return {
      id:
        playlist.id,

      name:
        playlist.name,

      description:
        playlist.description ||
        "",

      trackCount:
        playlist.trackCount ??
        0,

      createdAt:
        playlist.createdAt,

      updatedAt:
        playlist.updatedAt,
    };
  };

export const createPlaylistDetails =
  (playlist) => {
    if (!playlist) {
      return null;
    }

    return {
      ...createPlaylistSummary(
        playlist,
      ),

      tracks:
        (
          playlist.tracks ||
          []
        )
          .map(createTrack)
          .filter(Boolean),
    };
  };