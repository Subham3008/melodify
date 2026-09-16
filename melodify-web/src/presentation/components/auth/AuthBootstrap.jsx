"use client";

import { useEffect } from "react";

import { useAuthStore } from "@/presentation/stores/auth.store";

export default function AuthBootstrap() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return null;
}
