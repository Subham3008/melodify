"use client";

import { useEffect } from "react";

import TrackGrid from "@/presentation/components/track/TrackGrid";

import { useAuthStore } from "@/presentation/stores/auth.store";

import { usePopularStore } from "@/presentation/stores/popular.store";

export default function PopularOnMelodify() {
  const user = useAuthStore((state) => state.user);

  const tracks = usePopularStore((state) => state.tracks);

  const loading = usePopularStore((state) => state.loading);

  const error = usePopularStore((state) => state.error);

  const initialized = usePopularStore((state) => state.initialized);

  const fetchPopularTracks = usePopularStore(
    (state) => state.fetchPopularTracks,
  );

  useEffect(() => {
    if (!user || initialized) {
      return;
    }

    void fetchPopularTracks(10);
  }, [user, initialized, fetchPopularTracks]);

  if (!user) {
    return null;
  }

  if (loading && tracks.length === 0) {
    return (
      <section className="mb-10">
        <div className="mb-5">
          <div className="h-7 w-56 animate-pulse rounded bg-neutral-800" />

          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-neutral-800" />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({
            length: 5,
          }).map((_, index) => (
            <div
              key={index}
              className="h-72 animate-pulse rounded-lg bg-[#181818]"
            />
          ))}
        </div>
      </section>
    );
  }

  if (error || tracks.length === 0) {
    return null;
  }

  return (
    <section className="mb-10">
      <div className="mb-5">
        <h2 className="text-2xl font-black text-white">Trending songs</h2>

        <p className="mt-1 text-sm text-neutral-400">
          What listeners are enjoying right now
        </p>
      </div>

      <TrackGrid tracks={tracks} />
    </section>
  );
}
