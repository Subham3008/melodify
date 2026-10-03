import { create } from "zustand";

import {
  getRecentlyPlayedTracks,
} from "@/application/history/history.usecases";

export const useHistoryStore =
  create((set, get) => ({
    recentTracks: [],

    loading: false,

    initialized: false,

    error: null,

    /*
    |--------------------------------------------------------------------------
    | Fetch recently played
    |--------------------------------------------------------------------------
    */

    fetchRecentlyPlayed:
      async (limit = 8) => {
        if (get().loading) {
          return;
        }

        set({
          loading: true,
          error: null,
        });

        try {
          const tracks =
            await getRecentlyPlayedTracks(
              limit,
            );

          set({
            recentTracks: tracks,
            loading: false,
            initialized: true,
            error: null,
          });

          return tracks;
        } catch (error) {
          set({
            loading: false,
            initialized: true,

            error:
              error.response
                ?.data
                ?.message ||
              "Unable to load recently played tracks",
          });

          return [];
        }
      },

    /*
    |--------------------------------------------------------------------------
    | Update recently played immediately
    |--------------------------------------------------------------------------
    |
    | When PLAYED event succeeds, move that track
    | to the beginning of the list.
    |
    */

    pushRecentlyPlayed: (
      track,
      playedAt = null,
    ) => {
      if (!track?.id) {
        return;
      }

      set((state) => {
        const updatedTrack = {
          ...track,

          lastPlayedAt:
            playedAt ||
            new Date().toISOString(),
        };

        const withoutCurrent =
          state.recentTracks.filter(
            (item) =>
              item.id !== track.id,
          );

        return {
          recentTracks: [
            updatedTrack,
            ...withoutCurrent,
          ].slice(0, 10),
        };
      });
    },

    /*
    |--------------------------------------------------------------------------
    | Reset
    |--------------------------------------------------------------------------
    */

    resetHistory: () => {
      set({
        recentTracks: [],
        loading: false,
        initialized: false,
        error: null,
      });
    },
  }));