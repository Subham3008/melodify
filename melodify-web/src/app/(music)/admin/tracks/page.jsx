"use client";

import AdminOnly from "@/presentation/components/admin/AdminOnly";

import AdminTrackManager from "@/presentation/components/admin/AdminTrackManager";

export default function AdminTracksPage() {
  return (
    <AdminOnly>
      <section className="px-6 py-6 pb-28">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#1ed760]">
              Melodify Admin
            </p>

            <h1 className="mt-1 text-3xl font-bold text-white">
              Uploaded Tracks
            </h1>

            <p className="mt-2 text-sm text-neutral-400">
              Monitor processing, retry failed uploads and manage internally
              hosted songs.
            </p>
          </div>

          <AdminTrackManager />
        </div>
      </section>
    </AdminOnly>
  );
}
