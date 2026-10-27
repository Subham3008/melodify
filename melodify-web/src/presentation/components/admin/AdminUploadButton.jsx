"use client";

import Link from "next/link";

import { useAuthStore } from "@/presentation/stores/auth.store";

export default function AdminUploadButton() {
  const user = useAuthStore((state) => state.user);

  if (user?.role !== "admin") {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/admin/tracks"
        className="
          hidden
          items-center
          justify-center
          rounded-full
          border
          border-neutral-700
          bg-[#181818]
          px-4
          py-2
          text-sm
          font-semibold
          text-white
          transition
          hover:border-neutral-500
          hover:bg-[#282828]
          sm:inline-flex
        "
      >
        Manage
      </Link>

      <Link
        href="/admin/upload"
        className="
          inline-flex
          items-center
          justify-center
          rounded-full
          bg-[#1ed760]
          px-4
          py-2
          text-sm
          font-semibold
          text-black
          transition
          hover:bg-[#1fdf64]
        "
      >
        Upload Song
      </Link>
    </div>
  );
}
