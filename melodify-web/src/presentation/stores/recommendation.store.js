import { create } from "zustand";

import { getRecommendedTracks } from "@/application/recommendation/recommendation.usecases";

export const useRecommendationStore = create((set, get) => ({
  tracks: [],

  loading: false,

  error: null,

  /*
  |--------------------------------------------------------------------------
  | Recommendation refresh state
  |--------------------------------------------------------------------------
  |
  | refreshVersion:
  | Recommendation-affecting activity hone par increase hota hai.
  |
  | lastFetchedVersion:
  | Last successful recommendation fetch kis version ke liye hua tha.
  |
  */

  refreshVersion: 0,

  lastFetchedVersion: 0,

  /*
  |--------------------------------------------------------------------------
  | Mark recommendations stale
  |--------------------------------------------------------------------------
  |
  | Is function ke andar API request nahi hoti.
  |
  | Sirf frontend ko bataya jata hai:
  |
  | "Recommendation data may have changed."
  |
  */

  markRecommendationsStale: () => {
    set((state) => ({
      refreshVersion:
        state.refreshVersion + 1,
    }));
  },

  /*
  |--------------------------------------------------------------------------
  | Fetch recommendations
  |--------------------------------------------------------------------------
  */

  fetchRecommendations: async (
    limit = 10,
  ) => {
    /*
    |--------------------------------------------------------------------------
    | Remember version when request started
    |--------------------------------------------------------------------------
    */

    const versionAtStart =
      get().refreshVersion;

    set({
      loading: true,
      error: null,
    });

    try {
      const tracks =
        await getRecommendedTracks({
          limit,
        });

      set({
        tracks,

        loading: false,

        error: null,

        lastFetchedVersion:
          versionAtStart,
      });

      return tracks;
    } catch (error) {
      set({
        loading: false,

        error:
          error?.response?.data
            ?.message ||
          error?.message ||
          "Unable to load recommendations",
      });

      return [];
    }
  },

  /*
  |--------------------------------------------------------------------------
  | Clear recommendations
  |--------------------------------------------------------------------------
  */

  clearRecommendations: () => {
    set({
      tracks: [],

      loading: false,

      error: null,

      refreshVersion: 0,

      lastFetchedVersion: 0,
    });
  },
}));