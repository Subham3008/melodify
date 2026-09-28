import {
  create,
} from "zustand";

import {
  getUserLikedTracks,
  likeUserTrack,
  unlikeUserTrack,
} from "@/application/like/like.usecases";

export const useLikeStore =
  create(
    (set, get) => ({
      likedTracks: [],

      likedTrackIds: [],

      loading: false,

      initialized: false,

      error: null,

      togglingIds: [],

      fetchLikes:
        async () => {
          if (
            get().loading
          ) {
            return;
          }

          set({
            loading: true,
            error: null,
          });

          try {
            const tracks =
              await getUserLikedTracks();

            set({
              likedTracks:
                tracks,

              likedTrackIds:
                tracks.map(
                  (track) =>
                    track.id,
                ),

              loading: false,

              initialized: true,
            });
          } catch (error) {
            set({
              loading: false,

              error:
                error.response
                  ?.data
                  ?.message ||
                "Failed to load liked songs",
            });
          }
        },

      toggleLike:
        async (
          track,
        ) => {
          const state =
            get();

          if (
            state.togglingIds.includes(
              track.id,
            )
          ) {
            return;
          }

          const wasLiked =
            state.likedTrackIds.includes(
              track.id,
            );

          /*
          |--------------------------------------------------------------------------
          | Optimistic UI
          |--------------------------------------------------------------------------
          |
          | User ko API response ka wait karaye bina heart update karte hain.
          |
          */

          set((state) => ({
            togglingIds: [
              ...state.togglingIds,
              track.id,
            ],

            likedTrackIds:
              wasLiked
                ? state.likedTrackIds.filter(
                  (id) =>
                    id !==
                    track.id,
                )
                : [
                  ...state.likedTrackIds,
                  track.id,
                ],

            likedTracks:
              wasLiked
                ? state.likedTracks.filter(
                  (item) =>
                    item.id !==
                    track.id,
                )
                : [
                  track,

                  ...state.likedTracks.filter(
                    (item) =>
                      item.id !==
                      track.id,
                  ),
                ],

            error: null,
          }));

          try {
            if (wasLiked) {
              await unlikeUserTrack(
                track.id,
              );
            } else {
              await likeUserTrack(
                track.id,
              );
            }
          } catch (error) {
            /*
            |--------------------------------------------------------------------------
            | Rollback optimistic update
            |--------------------------------------------------------------------------
            */

            set((state) => ({
              likedTrackIds:
                wasLiked
                  ? state.likedTrackIds.includes(
                    track.id,
                  )
                    ? state.likedTrackIds
                    : [
                      ...state.likedTrackIds,
                      track.id,
                    ]
                  : state.likedTrackIds.filter(
                    (id) =>
                      id !==
                      track.id,
                  ),

              likedTracks:
                wasLiked
                  ? state.likedTracks.some(
                    (item) =>
                      item.id ===
                      track.id,
                  )
                    ? state.likedTracks
                    : [
                      track,
                      ...state.likedTracks,
                    ]
                  : state.likedTracks.filter(
                    (item) =>
                      item.id !==
                      track.id,
                  ),

              error:
                error.response
                  ?.data
                  ?.message ||
                "Unable to update liked song",
            }));
          } finally {
            set((state) => ({
              togglingIds:
                state.togglingIds.filter(
                  (id) =>
                    id !==
                    track.id,
                ),
            }));
          }
        },

      resetLikes: () => {
        set({
          likedTracks: [],
          likedTrackIds: [],
          loading: false,
          initialized: false,
          error: null,
          togglingIds: [],
        });
      },
    }),
  );