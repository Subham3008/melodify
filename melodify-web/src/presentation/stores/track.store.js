import { create } from "zustand";

import { getTrackCatalog } from "@/application/track/track.usecases";

const TRACK_LIMIT = 20;

/*
|--------------------------------------------------------------------------
| Request sequence
|--------------------------------------------------------------------------
|
| User quickly type kare:
|
| r
| ro
| roc
| rock
|
| Older response newer search ko overwrite na kare.
|
*/

let requestSequence = 0;

export const useTrackStore = create((set, get) => ({
  tracks: [],

  loading: false,

  error: null,

  page: 1,

  hasMore: true,

  searchQuery: "",

  fetchTracks: async ({ reset = false, search } = {}) => {
    /*
          |--------------------------------------------------------------------------
          | Search query
          |--------------------------------------------------------------------------
          */

    const nextSearch =
      typeof search === "string" ? search.trim() : get().searchQuery;

    /*
          |--------------------------------------------------------------------------
          | Page
          |--------------------------------------------------------------------------
          */

    const currentPage = reset ? 1 : get().page;

    /*
          |--------------------------------------------------------------------------
          | Avoid multiple Load More requests
          |--------------------------------------------------------------------------
          */

    if (get().loading && !reset) {
      return;
    }

    const requestId = ++requestSequence;

    set({
      loading: true,

      error: null,

      searchQuery: nextSearch,

      ...(reset
        ? {
          tracks: [],

          page: 1,

          hasMore: true,
        }
        : {}),
    });

    try {
      const tracks = await getTrackCatalog({
        page: currentPage,

        limit: TRACK_LIMIT,

        search: nextSearch,
      });

      /*
            |--------------------------------------------------------------------------
            | Ignore stale search responses
            |--------------------------------------------------------------------------
            */

      if (requestId !== requestSequence) {
        return;
      }

      set((state) => ({
        tracks: reset ? tracks : [...state.tracks, ...tracks],

        page: currentPage + 1,

        hasMore: tracks.length === TRACK_LIMIT,

        loading: false,
      }));
    } catch (error) {
      if (requestId !== requestSequence) {
        return;
      }

      set({
        loading: false,

        error: error.response?.data?.message || "Failed to load tracks",
      });
    }
  },

  clearSearch: () => {
    set({
      searchQuery: "",
    });

    get().fetchTracks({
      reset: true,
      search: "",
    });
  },

  resetTracks: () => {
    requestSequence++;

    set({
      tracks: [],
      loading: false,
      error: null,
      page: 1,
      hasMore: true,
      searchQuery: "",
    });
  },
}));
