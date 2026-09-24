import { create } from "zustand";

import {
  getTrackCatalog,
} from "@/application/track/track.usecases";

const TRACK_LIMIT = 20;

export const useTrackStore = create(
  (set, get) => ({
    tracks: [],

    loading: false,

    error: null,

    page: 1,

    hasMore: true,

    fetchTracks: async ({
      reset = false,
      search = "",
    } = {}) => {
      const currentPage =
        reset
          ? 1
          : get().page;

      set({
        loading: true,
        error: null,
      });

      try {
        const tracks =
          await getTrackCatalog({
            page: currentPage,
            limit: TRACK_LIMIT,
            search,
          });

        set((state) => ({
          tracks: reset
            ? tracks
            : [
              ...state.tracks,
              ...tracks,
            ],

          page:
            currentPage + 1,

          hasMore:
            tracks.length ===
            TRACK_LIMIT,

          loading: false,
        }));
      } catch (error) {
        set({
          loading: false,

          error:
            error.response?.data
              ?.message ||
            "Failed to load tracks",
        });
      }
    },

    resetTracks: () => {
      set({
        tracks: [],
        page: 1,
        hasMore: true,
        error: null,
      });
    },
  }),
);