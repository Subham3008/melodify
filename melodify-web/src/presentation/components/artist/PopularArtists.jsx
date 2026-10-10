"use client";

import Link from "next/link";
import { useEffect } from "react";

import { usePopularArtistsStore } from "@/presentation/stores/popularArtists.store";

export default function PopularArtists() {
  const artists = usePopularArtistsStore((state) => state.artists);

  const loading = usePopularArtistsStore((state) => state.loading);

  const error = usePopularArtistsStore((state) => state.error);

  const initialized = usePopularArtistsStore((state) => state.initialized);

  const fetchPopularArtists = usePopularArtistsStore(
    (state) => state.fetchPopularArtists,
  );

  useEffect(() => {
    if (initialized) {
      return;
    }

    void fetchPopularArtists(6);
  }, [initialized, fetchPopularArtists]);

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loading && artists.length === 0) {
    return (
      <section className="mb-12">
        <div className="mb-5">
          <div className="h-7 w-48 animate-pulse rounded bg-neutral-800" />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {Array.from({
            length: 6,
          }).map((_, index) => (
            <div key={index} className="rounded-lg p-3">
              <div className="aspect-square animate-pulse rounded-full bg-neutral-800" />

              <div className="mt-4 h-4 animate-pulse rounded bg-neutral-800" />

              <div className="mt-2 h-3 w-16 animate-pulse rounded bg-neutral-800" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error || artists.length === 0) {
    return null;
  }

  return (
    <section className="mb-12">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-2xl font-black tracking-tight text-white">
          Popular Artists
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:gap-3 lg:grid-cols-4 xl:grid-cols-6">
        {artists.map((artist) => (
          <Link
            key={artist.artistId}
            href={`/artist/${artist.artistId}`}
            className="
              group
              min-w-0
              rounded-lg
              p-3
              transition-colors
              duration-200
              hover:bg-[#1f1f1f]
            "
          >
            <div className="relative">
              {artist.imageUrl ? (
                <img
                  src={artist.imageUrl}
                  alt={artist.artistName}
                  className="
                    aspect-square
                    w-full
                    rounded-full
                    object-cover
                    shadow-xl
                  "
                />
              ) : (
                <div
                  className="
                    flex
                    aspect-square
                    w-full
                    items-center
                    justify-center
                    rounded-full
                    bg-neutral-800
                    text-5xl
                    font-black
                    text-neutral-300
                    shadow-xl
                  "
                >
                  {artist.artistName?.charAt(0).toUpperCase()}
                </div>
              )}

              <div
                className="
                  absolute
                  right-2
                  bottom-2
                  flex
                  h-12
                  w-12
                  translate-y-2
                  items-center
                  justify-center
                  rounded-full
                  bg-[#1ed760]
                  text-lg
                  text-black
                  opacity-0
                  shadow-xl
                  transition-all
                  duration-200
                  group-hover:translate-y-0
                  group-hover:opacity-100
                "
              >
                ▶
              </div>
            </div>

            <div className="mt-4 min-w-0">
              <h3 className="truncate font-bold text-white">
                {artist.artistName}
              </h3>

              <p className="mt-1 text-sm text-neutral-400">Artist</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
