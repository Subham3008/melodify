import { create } from "zustand";

import { getPopularTracks } from "@/application/recommendation/popular.usecases";

export const usePopularStore =
  create((set) => ({
    tracks: [],

    loading: false,

    error: null,

    initialized: false,

    fetchPopularTracks:
      async (
        limit = 10,
        force = false,
      ) => {
        const state =
          usePopularStore.getState();

        /*
        |--------------------------------------------------------------------------
        | In-memory cache
        |--------------------------------------------------------------------------
        |
        | Popular list doesn't need to refetch every route navigation.
        |
        */

        if (
          state.initialized &&
          !force
        ) {
          return state.tracks;
        }

        set({
          loading: true,

          error: null,
        });

        try {
          const tracks =
            await getPopularTracks(
              limit,
            );

          set({
            tracks,

            loading: false,

            error: null,

            initialized: true,
          });

          return tracks;
        } catch (error) {
          set({
            loading: false,

            error:
              error?.response
                ?.data
                ?.message ||
              error?.message ||
              "Unable to load popular tracks",
          });

          return [];
        }
      },

    clearPopularTracks:
      () => {
        set({
          tracks: [],

          loading: false,

          error: null,

          initialized: false,
        });
      },
  }));