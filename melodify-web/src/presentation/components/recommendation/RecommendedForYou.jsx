"use client";

import { useEffect } from "react";

import TrackGrid from "@/presentation/components/track/TrackGrid";

import { useAuthStore } from "@/presentation/stores/auth.store";

import { useRecommendationStore } from "@/presentation/stores/recommendation.store";

/*
|--------------------------------------------------------------------------
| Recommendation refresh delay
|--------------------------------------------------------------------------
|
| BullMQ worker ko profile update karne ke liye thoda time dete hain.
|
| Multiple playback events within this window:
|
| event
| event
| event
| ↓
| only one fetch
|
*/

const RECOMMENDATION_REFRESH_DELAY = 4000;

export default function RecommendedForYou() {
  const user = useAuthStore((state) => state.user);

  const tracks = useRecommendationStore((state) => state.tracks);

  const loading = useRecommendationStore((state) => state.loading);

  const error = useRecommendationStore((state) => state.error);

  const refreshVersion = useRecommendationStore(
    (state) => state.refreshVersion,
  );

  const lastFetchedVersion = useRecommendationStore(
    (state) => state.lastFetchedVersion,
  );

  const fetchRecommendations = useRecommendationStore(
    (state) => state.fetchRecommendations,
  );

  /*
  |--------------------------------------------------------------------------
  | Initial fetch
  |--------------------------------------------------------------------------
  |
  | User Home page par enter kare:
  |
  | GET /recommendations
  |
  */

  useEffect(() => {
    if (!user) {
      return;
    }

    void fetchRecommendations(10);
  }, [user, fetchRecommendations]);

  /*
  |--------------------------------------------------------------------------
  | Live recommendation refresh
  |--------------------------------------------------------------------------
  |
  | Playback event successfully recorded:
  |
  | GlobalPlayer
  | ↓
  | markRecommendationsStale()
  | ↓
  | refreshVersion changes
  | ↓
  | wait 4 seconds
  | ↓
  | fetchRecommendations()
  |
  | Every new activity resets the timer.
  |
  | Therefore:
  |
  | 5 rapid events
  | ≠ 5 API calls
  |
  | It becomes approximately:
  |
  | 5 rapid events
  | → 1 API call
  |
  */

  useEffect(() => {
    if (!user) {
      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Already fresh
    |--------------------------------------------------------------------------
    */

    if (refreshVersion <= lastFetchedVersion) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void fetchRecommendations(10);
    }, RECOMMENDATION_REFRESH_DELAY);

    /*
    |--------------------------------------------------------------------------
    | Debounce cleanup
    |--------------------------------------------------------------------------
    |
    | Another playback event comes before 4 sec:
    |
    | old timer cancelled
    | ↓
    | new 4 sec timer
    |
    */

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [user, refreshVersion, lastFetchedVersion, fetchRecommendations]);

  if (!user) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | Initial loading skeleton
  |--------------------------------------------------------------------------
  |
  | Background refresh me old tracks visible rahenge.
  |
  | Skeleton sirf tab:
  |
  | loading + no previous recommendations
  |
  */

  if (loading && tracks.length === 0) {
    return (
      <section className="mb-10">
        <div className="mb-5">
          <h2 className="text-2xl font-black text-white">
            Recommended for You
          </h2>

          <p className="mt-1 text-sm text-neutral-400">
            Based on your listening activity
          </p>
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
  | Hide empty / failed recommendation section
  |--------------------------------------------------------------------------
  */

  if (error || tracks.length === 0) {
    return null;
  }

  return (
    <section className="mb-10">
      <div className="mb-5">
        <h2 className="text-2xl font-black text-white">Recommended for You</h2>

        <p className="mt-1 text-sm text-neutral-400">
          Based on the artists and tracks you keep listening to
        </p>
      </div>

      <TrackGrid tracks={tracks} />
    </section>
  );
}
