import { create } from "zustand";

import { getArtistDetails } from "@/application/recommendation/artist.usecases";

export const useArtistStore =
  create((set) => ({
    artist: null,

    tracks: [],

    loading: false,

    error: null,

    fetchArtist:
      async (
        artistId,
      ) => {
        set({
          loading: true,

          error: null,
        });

        try {
          const result =
            await getArtistDetails(
              artistId,
              20,
            );

          if (!result) {
            set({
              artist:
                null,

              tracks: [],

              loading:
                false,

              error:
                "Artist not found",
            });

            return;
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
        } catch (error) {
          set({
            artist: null,

            tracks: [],

            loading:
              false,

            error:
              error?.response
                ?.data
                ?.message ||
              error?.message ||
              "Unable to load artist",
          });
        }
      },

    clearArtist:
      () => {
        set({
          artist: null,

          tracks: [],

          loading: false,

          error: null,
        });
      },
  }));