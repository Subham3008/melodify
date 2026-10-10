import { create } from "zustand";

import { getPopularArtists } from "@/application/recommendation/popularArtists.usecases";

export const usePopularArtistsStore =
  create((set) => ({
    artists: [],

    loading: false,

    error: null,

    initialized: false,

    fetchPopularArtists:
      async (
        limit = 6,
        force = false,
      ) => {
        const state =
          usePopularArtistsStore.getState();

        if (
          state.initialized &&
          !force
        ) {
          return state.artists;
        }

        set({
          loading: true,

          error: null,
        });

        try {
          const artists =
            await getPopularArtists(
              limit,
            );

          set({
            artists,

            loading:
              false,

            error:
              null,

            initialized:
              true,
          });

          return artists;
        } catch (error) {
          set({
            loading:
              false,

            error:
              error?.response
                ?.data
                ?.message ||
              error?.message ||
              "Unable to load popular artists",
          });

          return [];
        }
      },

    clearPopularArtists:
      () => {
        set({
          artists: [],

          loading: false,

          error: null,

          initialized:
            false,
        });
      },
  }));