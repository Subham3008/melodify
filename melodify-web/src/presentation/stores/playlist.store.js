import {
  create,
} from "zustand";

import {
  addUserTrackToPlaylist,
  createUserPlaylist,
  deleteUserPlaylist,
  getUserPlaylist,
  getUserPlaylists,
  removeUserTrackFromPlaylist,
} from "@/application/playlist/playlist.usecases";

export const usePlaylistStore =
  create(
    (set, get) => ({
      playlists: [],

      currentPlaylist:
        null,

      loading: false,

      detailsLoading:
        false,

      initialized:
        false,

      error: null,

      fetchPlaylists:
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
            const playlists =
              await getUserPlaylists();

            set({
              playlists,

              loading: false,

              initialized:
                true,
            });
          } catch (error) {
            set({
              loading: false,

              error:
                error.response
                  ?.data
                  ?.message ||
                "Failed to load playlists",
            });
          }
        },

      createPlaylist:
        async (
          payload,
        ) => {
          set({
            error: null,
          });

          try {
            const playlist =
              await createUserPlaylist(
                payload,
              );

            set((state) => ({
              playlists: [
                playlist,
                ...state.playlists,
              ],
            }));

            return playlist;
          } catch (error) {
            set({
              error:
                error.response
                  ?.data
                  ?.message ||
                "Unable to create playlist",
            });

            throw error;
          }
        },

      fetchPlaylist:
        async (
          playlistId,
        ) => {
          set({
            detailsLoading:
              true,

            error: null,
          });

          try {
            const playlist =
              await getUserPlaylist(
                playlistId,
              );

            set({
              currentPlaylist:
                playlist,

              detailsLoading:
                false,
            });
          } catch (error) {
            set({
              currentPlaylist:
                null,

              detailsLoading:
                false,

              error:
                error.response
                  ?.data
                  ?.message ||
                "Unable to load playlist",
            });
          }
        },

      addTrack:
        async (
          playlistId,
          track,
        ) => {
          try {
            const response =
              await addUserTrackToPlaylist(
                playlistId,
                track.id,
              );

            if (
              !response.data
                .added
            ) {
              return false;
            }

            set((state) => ({
              playlists:
                state.playlists.map(
                  (playlist) =>
                    playlist.id ===
                      playlistId
                      ? {
                        ...playlist,

                        trackCount:
                          playlist.trackCount +
                          1,
                      }
                      : playlist,
                ),

              currentPlaylist:
                state
                  .currentPlaylist
                  ?.id ===
                  playlistId
                  ? {
                    ...state.currentPlaylist,

                    tracks: [
                      ...state
                        .currentPlaylist
                        .tracks,

                      track,
                    ],

                    trackCount:
                      state
                        .currentPlaylist
                        .trackCount +
                      1,
                  }
                  : state.currentPlaylist,
            }));

            return true;
          } catch (error) {
            set({
              error:
                error.response
                  ?.data
                  ?.message ||
                "Unable to add track",
            });

            return false;
          }
        },

      removeTrack:
        async (
          playlistId,
          trackId,
        ) => {
          try {
            const response =
              await removeUserTrackFromPlaylist(
                playlistId,
                trackId,
              );

            if (
              !response.data
                .removed
            ) {
              return;
            }

            set((state) => ({
              playlists:
                state.playlists.map(
                  (playlist) =>
                    playlist.id ===
                      playlistId
                      ? {
                        ...playlist,

                        trackCount:
                          Math.max(
                            playlist.trackCount -
                            1,

                            0,
                          ),
                      }
                      : playlist,
                ),

              currentPlaylist:
                state
                  .currentPlaylist
                  ?.id ===
                  playlistId
                  ? {
                    ...state.currentPlaylist,

                    tracks:
                      state.currentPlaylist.tracks.filter(
                        (track) =>
                          track.id !==
                          trackId,
                      ),

                    trackCount:
                      Math.max(
                        state
                          .currentPlaylist
                          .trackCount -
                        1,

                        0,
                      ),
                  }
                  : state.currentPlaylist,
            }));
          } catch (error) {
            set({
              error:
                error.response
                  ?.data
                  ?.message ||
                "Unable to remove track",
            });
          }
        },

      deletePlaylist:
        async (
          playlistId,
        ) => {
          try {
            await deleteUserPlaylist(
              playlistId,
            );

            set((state) => ({
              playlists:
                state.playlists.filter(
                  (playlist) =>
                    playlist.id !==
                    playlistId,
                ),

              currentPlaylist:
                state
                  .currentPlaylist
                  ?.id ===
                  playlistId
                  ? null
                  : state.currentPlaylist,
            }));
          } catch (error) {
            set({
              error:
                error.response
                  ?.data
                  ?.message ||
                "Unable to delete playlist",
            });

            throw error;
          }
        },

      resetPlaylists:
        () => {
          set({
            playlists: [],

            currentPlaylist:
              null,

            loading: false,

            detailsLoading:
              false,

            initialized:
              false,

            error: null,
          });
        },
    }),
  );