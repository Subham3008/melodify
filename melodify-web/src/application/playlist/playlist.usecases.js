import {
  createPlaylistDetails,
  createPlaylistSummary,
} from "@/domain/playlist/playlist.entity";

import {
  addTrackToPlaylistRequest,
  createPlaylistRequest,
  deletePlaylistRequest,
  getPlaylistRequest,
  getPlaylistsRequest,
  removeTrackFromPlaylistRequest,
} from "@/infrastructure/playlist/playlist.api";

export const createUserPlaylist =
  async (
    payload,
  ) => {
    const response =
      await createPlaylistRequest(
        payload,
      );

    return createPlaylistSummary(
      response.data,
    );
  };

export const getUserPlaylists =
  async () => {
    const response =
      await getPlaylistsRequest();

    return response.data
      .map(
        createPlaylistSummary,
      )
      .filter(Boolean);
  };

export const getUserPlaylist =
  async (
    playlistId,
  ) => {
    const response =
      await getPlaylistRequest(
        playlistId,
      );

    return createPlaylistDetails(
      response.data,
    );
  };

export const deleteUserPlaylist =
  async (
    playlistId,
  ) => {
    return deletePlaylistRequest(
      playlistId,
    );
  };

export const addUserTrackToPlaylist =
  async (
    playlistId,
    trackId,
  ) => {
    return addTrackToPlaylistRequest(
      playlistId,
      trackId,
    );
  };

export const removeUserTrackFromPlaylist =
  async (
    playlistId,
    trackId,
  ) => {
    return removeTrackFromPlaylistRequest(
      playlistId,
      trackId,
    );
  };