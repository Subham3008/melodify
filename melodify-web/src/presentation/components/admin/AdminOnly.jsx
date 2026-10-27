"use client";

import { useEffect } from "react";

import { useRouter } from "next/navigation";

import { useAuthStore } from "@/presentation/stores/auth.store";

export default function AdminOnly({ children }) {
  const router = useRouter();

  const user = useAuthStore((state) => state.user);

  const loading = useAuthStore((state) => state.loading);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user || user.role !== "admin") {
      router.replace("/");
    }
  }, [loading, user, router]);

  if (loading) {
    return null;
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  return children;
}
