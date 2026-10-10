import {
  create,
} from "zustand";

import {
  searchAll,
} from "@/application/search/search.usecases";

const TRACK_LIMIT = 20;

const ARTIST_LIMIT = 6;

/*
|--------------------------------------------------------------------------
| Prevent stale search response
|--------------------------------------------------------------------------
*/

let searchRequestSequence = 0;

const removeDuplicateTracks = (
  tracks,
) => {
  return Array.from(
    new Map(
      tracks.map(
        (track) => [
          track.id,
          track,
        ],
      ),
    ).values(),
  );
};

export const useSearchStore =
  create((set, get) => ({
    query: "",

    artists: [],

    tracks: [],

    page: 1,

    hasMore: false,

    loading: false,

    error: null,

    /*
    |--------------------------------------------------------------------------
    | Search
    |--------------------------------------------------------------------------
    */

    search:
      async ({
        query,
        reset = true,
      }) => {
        const normalizedQuery =
          query.trim();

        if (
          !normalizedQuery
        ) {
          get().clear();

          return;
        }

        const requestId =
          ++searchRequestSequence;

        const currentPage =
          reset
            ? 1
            : get().page;

        set({
          loading: true,

          error: null,

          query:
            normalizedQuery,

          ...(reset
            ? {
              artists: [],

              tracks: [],

              page: 1,

              hasMore:
                false,
            }
            : {}),
        });

        try {
          const result =
            await searchAll({
              query:
                normalizedQuery,

              page:
                currentPage,

              trackLimit:
                TRACK_LIMIT,

              artistLimit:
                ARTIST_LIMIT,
            });

          if (
            requestId !==
            searchRequestSequence
          ) {
            return;
          }

          set((state) => ({
            /*
            |--------------------------------------------------------------------------
            | Artist results only need first page
            |--------------------------------------------------------------------------
            */

            artists:
              reset
                ? result.artists
                : state.artists,

            tracks:
              removeDuplicateTracks(
                reset
                  ? result.tracks
                  : [
                    ...state.tracks,
                    ...result.tracks,
                  ],
              ),

            page:
              currentPage +
              1,

            hasMore:
              result.tracks
                .length ===
              TRACK_LIMIT,

            loading:
              false,

            error: null,
          }));
        } catch (error) {
          if (
            requestId !==
            searchRequestSequence
          ) {
            return;
          }

          set({
            loading: false,

            error:
              error?.response
                ?.data
                ?.message ||
              "Unable to search",
          });
        }
      },

    /*
    |--------------------------------------------------------------------------
    | Load more songs
    |--------------------------------------------------------------------------
    */

    loadMore:
      async () => {
        const {
          query,
          loading,
          hasMore,
        } = get();

        if (
          !query ||
          loading ||
          !hasMore
        ) {
          return;
        }

        await get().search({
          query,

          reset: false,
        });
      },

    /*
    |--------------------------------------------------------------------------
    | Clear
    |--------------------------------------------------------------------------
    */

    clear:
      () => {
        ++searchRequestSequence;

        set({
          query: "",

          artists: [],

          tracks: [],

          page: 1,

          hasMore: false,

          loading: false,

          error: null,
        });
      },
  }));