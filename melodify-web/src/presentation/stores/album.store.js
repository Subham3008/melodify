import {
  create,
} from "zustand";

import {
  getAlbumDetails,
} from "@/application/album/album.usecases";

export const useAlbumStore =
  create((set) => ({
    album: null,

    tracks: [],

    loading: false,

    error: null,

    /*
    |--------------------------------------------------------------------------
    | Fetch album
    |--------------------------------------------------------------------------
    */

    fetchAlbum:
      async (
        albumId,
      ) => {
        if (!albumId) {
          return;
        }

        set({
          loading: true,

          error: null,
        });

        try {
          const result =
            await getAlbumDetails(
              albumId,
            );

          set({
            album:
              result.album,

            tracks:
              result.tracks,

            loading:
              false,

            error:
              null,
          });
        } catch (error) {
          set({
            album: null,

            tracks: [],

            loading:
              false,

            error:
              error?.response
                ?.data
                ?.message ||
              "Unable to load album",
          });
        }
      },

    /*
    |--------------------------------------------------------------------------
    | Clear
    |--------------------------------------------------------------------------
    */

    clearAlbum:
      () => {
        set({
          album: null,

          tracks: [],

          loading:
            false,

          error:
            null,
        });
      },
  }));