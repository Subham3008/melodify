import { create } from "zustand";

import { getMoreFromLikedArtist } from "@/application/recommendation/moreFromLikedArtist.usecases";

export const useMoreFromLikedArtistStore =
  create((set) => ({
    artist: null,

    tracks: [],

    loading: false,

    error: null,

    fetchMoreFromLikedArtist:
      async (
        limit = 6,
      ) => {
        set({
          loading: true,

          error: null,
        });

        try {
          const result =
            await getMoreFromLikedArtist(
              limit,
            );

          if (!result) {
            set({
              artist: null,

              tracks: [],

              loading:
                false,

              error:
                null,
            });

            return null;
          }

          set({
            artist:
              result.artist,

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
            loading: false,

            error:
              error?.response
                ?.data
                ?.message ||
              error?.message ||
              "Unable to load artist recommendations",
          });

          return null;
        }
      },

    clearMoreFromLikedArtist:
      () => {
        set({
          artist: null,

          tracks: [],

          loading: false,

          error: null,
        });
      },
  }));