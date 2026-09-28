"use client";

import { useEffect } from "react";

import { useAuthStore } from "@/presentation/stores/auth.store";

import { useLikeStore } from "@/presentation/stores/like.store";

export default function LikesBootstrap() {
  const user = useAuthStore((state) => state.user);

  const authLoading = useAuthStore((state) => state.loading);

  const initialized = useLikeStore((state) => state.initialized);

  const fetchLikes = useLikeStore((state) => state.fetchLikes);

  const resetLikes = useLikeStore((state) => state.resetLikes);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (user && !initialized) {
      fetchLikes();

      return;
    }

    if (!user && initialized) {
      resetLikes();
    }
  }, [user, authLoading, initialized, fetchLikes, resetLikes]);

  return null;
}
