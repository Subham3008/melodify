import { create } from "zustand";

import { getBecauseYouListenedTo } from "@/application/recommendation/becauseYouListened.usecases";

export const useBecauseYouListenedStore =
  create((set) => ({
    seedTrack: null,

    tracks: [],

    loading: false,

    error: null,

    fetchBecauseYouListened:
      async (
        limit = 6,
      ) => {
        set({
          loading: true,

          error: null,
        });

        try {
          const result =
            await getBecauseYouListenedTo(
              limit,
            );

          if (!result) {
            set({
              seedTrack:
                null,

              tracks: [],

              loading:
                false,

              error:
                null,
            });

            return null;
          }

          set({
            seedTrack:
              result.seedTrack,

            tracks:
              result.tracks,

            loading:
              false,

            error:
              null,
          });

          return result;
        } catch (error) {
          set({
            loading:
              false,

            error:
              error?.response
                ?.data
                ?.message ||
              error?.message ||
              "Unable to load recommendations",
          });

          return null;
        }
      },

    clearBecauseYouListened:
      () => {
        set({
          seedTrack: null,

          tracks: [],

          loading: false,

          error: null,
        });
      },
  }));