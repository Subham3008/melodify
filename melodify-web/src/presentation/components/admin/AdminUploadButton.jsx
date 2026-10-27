"use client";

import Link from "next/link";

import { useAuthStore } from "@/presentation/stores/auth.store";

export default function AdminUploadButton() {
  const user = useAuthStore((state) => state.user);

  if (user?.role !== "admin") {
    return null;
  }

  return (
    <Link
      href="/admin/upload"
      className="
        inline-flex
        items-center
        justify-center
        rounded-full
        bg-green-500
        px-4
        py-2
        text-sm
        font-semibold
        text-black
        transition
        hover:bg-green-400
      "
    >
      Upload Song
    </Link>
  );
}
