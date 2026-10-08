import { create } from "zustand";

import { getRecommendedTracks } from "@/application/recommendation/recommendation.usecases";

export const useRecommendationStore = create(
  (set) => ({
    tracks: [],

    loading: false,

    error: null,

    fetchRecommendations: async (
      limit = 10,
    ) => {
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
        });

        return tracks;
      } catch (error) {
        set({
          loading: false,

          error:
            error?.response?.data?.message ||
            error?.message ||
            "Unable to load recommendations",
        });

        return [];
      }
    },

    clearRecommendations: () => {
      set({
        tracks: [],

        loading: false,

        error: null,
      });
    },
  }),
);