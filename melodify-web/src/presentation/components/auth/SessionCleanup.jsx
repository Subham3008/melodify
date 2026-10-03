"use client";

import { useEffect } from "react";

import { useAuthStore } from "@/presentation/stores/auth.store";
import { usePlayerStore } from "@/presentation/stores/player.store";
import { useLikeStore } from "@/presentation/stores/like.store";
import { usePlaylistStore } from "@/presentation/stores/playlist.store";
import { useHistoryStore } from "@/presentation/stores/history.store";

export default function SessionCleanup() {
  const user = useAuthStore((state) => state.user);

  const authLoading = useAuthStore((state) => state.loading);

  const clearPlayer = usePlayerStore((state) => state.clearPlayer);

  const resetLikes = useLikeStore((state) => state.resetLikes);

  const resetPlaylists = usePlaylistStore((state) => state.resetPlaylists);

  const resetHistory = useHistoryStore((state) => state.resetHistory);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    /*
    |--------------------------------------------------------------------------
    | No authenticated user
    |--------------------------------------------------------------------------
    |
    | Clear ALL user-specific frontend state.
    |
    */

    if (!user) {
      clearPlayer();

      resetLikes();

      resetPlaylists();

      resetHistory();
    }
  }, [
    user,
    authLoading,
    clearPlayer,
    resetLikes,
    resetPlaylists,
    resetHistory,
  ]);

  return null;
}
