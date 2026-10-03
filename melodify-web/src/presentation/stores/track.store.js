import { create } from "zustand";

import { getTrackCatalog } from "@/application/track/track.usecases";

const TRACK_LIMIT = 20;

/*
|--------------------------------------------------------------------------
| Request sequence
|--------------------------------------------------------------------------
|
| Agar user rapidly:
|
| rock
| ↓
| pop
| ↓
| jazz
|
| search kare, old response latest result ko overwrite nahi karega.
|
*/

let requestSequence = 0;

/*
|--------------------------------------------------------------------------
| Remove duplicate tracks
|--------------------------------------------------------------------------
*/

const removeDuplicateTracks = (tracks) => {
  return Array.from(new Map(tracks.map((track) => [track.id, track])).values());
};

export const useTrackStore = create((set, get) => ({
  /*
    |--------------------------------------------------------------------------
    | Currently visible tracks
    |--------------------------------------------------------------------------
    |
    | Ye TrackGrid ko milte hain.
    |
    | Normal mode:
    | tracks = catalogTracks
    |
    | Search mode:
    | tracks = search results
    |
    */

  tracks: [],

  loading: false,

  error: null,

  /*
    |--------------------------------------------------------------------------
    | Current visible pagination
    |--------------------------------------------------------------------------
    */

  page: 1,

  hasMore: true,

  /*
    |--------------------------------------------------------------------------
    | Current search
    |--------------------------------------------------------------------------
    */

  searchQuery: "",

  /*
    |--------------------------------------------------------------------------
    | Discover Music cache
    |--------------------------------------------------------------------------
    |
    | Ye specifically normal homepage catalog ko memory me rakhega.
    |
    */

  catalogTracks: [],

  catalogPage: 1,

  catalogHasMore: true,

  catalogInitialized: false,

  /*
    |--------------------------------------------------------------------------
    | Fetch tracks
    |--------------------------------------------------------------------------
    */

  fetchTracks: async ({ reset = false, search } = {}) => {
    /*
      |--------------------------------------------------------------------------
      | Resolve search query
      |--------------------------------------------------------------------------
      |
      | Explicit search provided:
      | use it.
      |
      | Load More:
      | existing searchQuery use karo.
      |
      */

    const requestedSearch =
      typeof search === "string" ? search.trim() : get().searchQuery.trim();

    const isSearch = requestedSearch.length > 0;

    /*
      |--------------------------------------------------------------------------
      | Every request / restore gets new sequence id
      |--------------------------------------------------------------------------
      */

    const requestId = ++requestSequence;

    /*
      |--------------------------------------------------------------------------
      | CACHE HIT
      |--------------------------------------------------------------------------
      |
      | User normal "/" route pe wapas aaya.
      |
      | Agar catalog pehle fetch ho chuka hai,
      | backend ko dobara call nahi karna.
      |
      */

    if (!isSearch && reset && get().catalogInitialized) {
      const state = get();

      set({
        tracks: state.catalogTracks,

        page: state.catalogPage,

        hasMore: state.catalogHasMore,

        searchQuery: "",

        loading: false,

        error: null,
      });

      return state.catalogTracks;
    }

    /*
      |--------------------------------------------------------------------------
      | Decide page
      |--------------------------------------------------------------------------
      */

    const currentPage = reset ? 1 : isSearch ? get().page : get().catalogPage;

    /*
      |--------------------------------------------------------------------------
      | Start loading
      |--------------------------------------------------------------------------
      */

    set({
      loading: true,

      error: null,

      searchQuery: requestedSearch,

      /*
        |--------------------------------------------------------------------------
        | New search → old visible results remove
        |--------------------------------------------------------------------------
        */

      ...(reset && isSearch
        ? {
          tracks: [],
          page: 1,
          hasMore: true,
        }
        : {}),

      /*
        |--------------------------------------------------------------------------
        | First-ever Discover fetch
        |--------------------------------------------------------------------------
        */

      ...(reset && !isSearch && !get().catalogInitialized
        ? {
          tracks: [],
        }
        : {}),
    });

    try {
      /*
        |--------------------------------------------------------------------------
        | API request
        |--------------------------------------------------------------------------
        */

      const newTracks = await getTrackCatalog({
        page: currentPage,

        limit: TRACK_LIMIT,

        search: requestedSearch,
      });

      /*
        |--------------------------------------------------------------------------
        | Ignore stale responses
        |--------------------------------------------------------------------------
        */

      if (requestId !== requestSequence) {
        return [];
      }

      /*
        |--------------------------------------------------------------------------
        | SEARCH RESULTS
        |--------------------------------------------------------------------------
        |
        | Search data Discover cache me save nahi hogi.
        |
        */

      if (isSearch) {
        set((state) => {
          const nextTracks = removeDuplicateTracks(
            reset ? newTracks : [...state.tracks, ...newTracks],
          );

          return {
            tracks: nextTracks,

            page: currentPage + 1,

            hasMore: newTracks.length === TRACK_LIMIT,

            searchQuery: requestedSearch,

            loading: false,

            error: null,
          };
        });

        return newTracks;
      }

      /*
        |--------------------------------------------------------------------------
        | DISCOVER CATALOG
        |--------------------------------------------------------------------------
        |
        | Normal songs ko cache karo.
        |
        */

      set((state) => {
        const nextCatalogTracks = removeDuplicateTracks(
          reset ? newTracks : [...state.catalogTracks, ...newTracks],
        );

        const nextPage = currentPage + 1;

        const nextHasMore = newTracks.length === TRACK_LIMIT;

        return {
          /*
            |--------------------------------------------------------------------------
            | Cache
            |--------------------------------------------------------------------------
            */

          catalogTracks: nextCatalogTracks,

          catalogPage: nextPage,

          catalogHasMore: nextHasMore,

          catalogInitialized: true,

          /*
            |--------------------------------------------------------------------------
            | Visible state
            |--------------------------------------------------------------------------
            */

          tracks: nextCatalogTracks,

          page: nextPage,

          hasMore: nextHasMore,

          searchQuery: "",

          loading: false,

          error: null,
        };
      });

      return newTracks;
    } catch (error) {
      /*
        |--------------------------------------------------------------------------
        | Old failed request should also be ignored
        |--------------------------------------------------------------------------
        */

      if (requestId !== requestSequence) {
        return [];
      }

      set({
        loading: false,

        error: error.response?.data?.message || "Unable to load tracks",
      });

      return [];
    }
  },

  /*
    |--------------------------------------------------------------------------
    | Clear search
    |--------------------------------------------------------------------------
    |
    | Search result remove karo aur cached Discover instantly restore karo.
    |
    */

  clearSearch: () => {
    /*
      |--------------------------------------------------------------------------
      | Cancel logical ownership of any pending search request
      |--------------------------------------------------------------------------
      */

    ++requestSequence;

    const state = get();

    set({
      searchQuery: "",

      tracks: state.catalogInitialized ? state.catalogTracks : [],

      page: state.catalogPage,

      hasMore: state.catalogHasMore,

      loading: false,

      error: null,
    });
  },

  /*
    |--------------------------------------------------------------------------
    | Full reset
    |--------------------------------------------------------------------------
    |
    | Hard/manual state reset ke liye.
    |
    */

  resetTracks: () => {
    ++requestSequence;

    set({
      tracks: [],

      loading: false,

      error: null,

      page: 1,

      hasMore: true,

      searchQuery: "",

      catalogTracks: [],

      catalogPage: 1,

      catalogHasMore: true,

      catalogInitialized: false,
    });
  },
}));
