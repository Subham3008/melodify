"use client";

import { useEffect } from "react";

import TrackGrid from "@/presentation/components/track/TrackGrid";

import { useAuthStore } from "@/presentation/stores/auth.store";

import { useRecommendationStore } from "@/presentation/stores/recommendation.store";

import { useMoreFromLikedArtistStore } from "@/presentation/stores/moreFromLikedArtist.store";

const REFRESH_DELAY = 4000;

export default function MoreFromLikedArtist() {
  const user = useAuthStore((state) => state.user);

  /*
  |--------------------------------------------------------------------------
  | Existing recommendation refresh signal
  |--------------------------------------------------------------------------
  |
  | Playback changes already update this.
  |
  */

  const refreshVersion = useRecommendationStore(
    (state) => state.refreshVersion,
  );

  const artist = useMoreFromLikedArtistStore((state) => state.artist);

  const tracks = useMoreFromLikedArtistStore((state) => state.tracks);

  const loading = useMoreFromLikedArtistStore((state) => state.loading);

  const error = useMoreFromLikedArtistStore((state) => state.error);

  const fetchMoreFromLikedArtist = useMoreFromLikedArtistStore(
    (state) => state.fetchMoreFromLikedArtist,
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

    void fetchMoreFromLikedArtist(6);
  }, [user, fetchMoreFromLikedArtist]);

  /*
  |--------------------------------------------------------------------------
  | Refresh after recommendation-affecting activity
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!user || refreshVersion === 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void fetchMoreFromLikedArtist(6);
    }, REFRESH_DELAY);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [user, refreshVersion, fetchMoreFromLikedArtist]);

  if (!user) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | Initial loading skeleton
  |--------------------------------------------------------------------------
  */

  if (loading && tracks.length === 0) {
    return (
      <section className="mb-10">
        <div className="mb-5">
          <div className="h-7 w-56 animate-pulse rounded bg-neutral-800" />
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

  if (error || !artist || tracks.length === 0) {
    return null;
  }

  return (
    <section className="mb-10">
      <div className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
          More From Artists You Like
        </p>

        <h2 className="mt-1 text-2xl font-black text-white">
          {artist.artistName}
        </h2>

        <p className="mt-1 text-sm text-neutral-400">
          Based on your likes and playlists
        </p>
      </div>

      <TrackGrid tracks={tracks} />
    </section>
  );
}
