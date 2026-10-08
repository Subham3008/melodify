"use client";

import { useEffect } from "react";

import TrackGrid from "@/presentation/components/track/TrackGrid";

import { useAuthStore } from "@/presentation/stores/auth.store";

import { useRecommendationStore } from "@/presentation/stores/recommendation.store";

export default function RecommendedForYou() {
  const user = useAuthStore((state) => state.user);

  const tracks = useRecommendationStore((state) => state.tracks);

  const loading = useRecommendationStore((state) => state.loading);

  const error = useRecommendationStore((state) => state.error);

  const fetchRecommendations = useRecommendationStore(
    (state) => state.fetchRecommendations,
  );

  useEffect(() => {
    if (user) {
      fetchRecommendations(10);
    }
  }, [user, fetchRecommendations]);

  if (!user) {
    return null;
  }

  if (loading && tracks.length === 0) {
    return (
      <section className="mb-10">
        <div className="mb-5">
          <h2
            className="
              text-2xl
              font-black
              text-white
            "
          >
            Recommended for You
          </h2>

          <p
            className="
              mt-1
              text-sm
              text-neutral-400
            "
          >
            Based on your listening activity
          </p>
        </div>

        <div
          className="
            grid
            grid-cols-2
            gap-4
            sm:grid-cols-3
            lg:grid-cols-4
            xl:grid-cols-5
          "
        >
          {Array.from({
            length: 5,
          }).map((_, index) => (
            <div
              key={index}
              className="
                h-72
                animate-pulse
                rounded-lg
                bg-[#181818]
              "
            />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return null;
  }

  if (tracks.length === 0) {
    return null;
  }

  return (
    <section className="mb-10">
      <div className="mb-5">
        <h2
          className="
            text-2xl
            font-black
            text-white
          "
        >
          Recommended for You
        </h2>

        <p
          className="
            mt-1
            text-sm
            text-neutral-400
          "
        >
          Based on the artists and tracks you keep listening to
        </p>
      </div>

      <TrackGrid tracks={tracks} />
    </section>
  );
}
