"use client";

import { useEffect } from "react";

import TrackGrid from "@/presentation/components/track/TrackGrid";

import { useAuthStore } from "@/presentation/stores/auth.store";

import { useRecommendationStore } from "@/presentation/stores/recommendation.store";

import { useBecauseYouListenedStore } from "@/presentation/stores/becauseYouListened.store";

const REFRESH_DELAY = 4000;

export default function BecauseYouListened() {
  const user = useAuthStore((state) => state.user);

  /*
  |--------------------------------------------------------------------------
  | Existing global recommendation refresh version
  |--------------------------------------------------------------------------
  |
  | Playback event hone par ye already change ho raha hai.
  |
  */

  const refreshVersion = useRecommendationStore(
    (state) => state.refreshVersion,
  );

  const seedTrack = useBecauseYouListenedStore((state) => state.seedTrack);

  const tracks = useBecauseYouListenedStore((state) => state.tracks);

  const loading = useBecauseYouListenedStore((state) => state.loading);

  const error = useBecauseYouListenedStore((state) => state.error);

  const fetchBecauseYouListened = useBecauseYouListenedStore(
    (state) => state.fetchBecauseYouListened,
  );

  /*
  |--------------------------------------------------------------------------
  | Initial load
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!user) {
      return;
    }

    void fetchBecauseYouListened(6);
  }, [user, fetchBecauseYouListened]);

  /*
  |--------------------------------------------------------------------------
  | Refresh after listening activity
  |--------------------------------------------------------------------------
  |
  | Same refresh signal jo RecommendedForYou use karta hai.
  |
  */

  useEffect(() => {
    if (!user || refreshVersion === 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void fetchBecauseYouListened(6);
    }, REFRESH_DELAY);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [user, refreshVersion, fetchBecauseYouListened]);

  if (!user) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | Initial loading
  |--------------------------------------------------------------------------
  */

  if (loading && tracks.length === 0) {
    return (
      <section className="mb-10">
        <div className="mb-5">
          <div className="h-7 w-64 animate-pulse rounded bg-neutral-800" />
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

  /*
  |--------------------------------------------------------------------------
  | Hide empty section
  |--------------------------------------------------------------------------
  */

  if (error || !seedTrack || tracks.length === 0) {
    return null;
  }

  return (
    <section className="mb-10">
      <div className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
          Because You Listened To
        </p>

        <h2 className="mt-1 max-w-3xl truncate text-2xl font-black text-white">
          {seedTrack.title}
        </h2>

        <p className="mt-1 text-sm text-neutral-400">
          More from {seedTrack.artistName}
        </p>
      </div>

      <TrackGrid tracks={tracks} />
    </section>
  );
}
