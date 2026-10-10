"use client";

import Link from "next/link";

import TrackGrid from "@/presentation/components/track/TrackGrid";

import { useSearchStore } from "@/presentation/stores/search.store";

export default function SearchResults({ query }) {
  const artists = useSearchStore((state) => state.artists);

  const tracks = useSearchStore((state) => state.tracks);

  const loading = useSearchStore((state) => state.loading);

  const error = useSearchStore((state) => state.error);

  const hasMore = useSearchStore((state) => state.hasMore);

  const loadMore = useSearchStore((state) => state.loadMore);

  /*
  |--------------------------------------------------------------------------
  | Initial loading
  |--------------------------------------------------------------------------
  */

  if (loading && artists.length === 0 && tracks.length === 0) {
    return <div className="py-10 text-neutral-400">Searching...</div>;
  }

  /*
  |--------------------------------------------------------------------------
  | Error
  |--------------------------------------------------------------------------
  */

  if (error) {
    return (
      <div
        className="
          rounded-lg
          bg-red-950/50
          px-4
          py-3
          text-red-300
        "
      >
        {error}
      </div>
    );
  }

  const hasArtists = artists.length > 0;

  const hasTracks = tracks.length > 0;

  if (!hasArtists && !hasTracks) {
    return (
      <div
        className="
          rounded-lg
          border
          border-neutral-800
          bg-[#181818]
          p-10
          text-center
        "
      >
        <h2 className="text-xl font-bold text-white">No results found</h2>

        <p className="mt-2 text-sm text-neutral-400">
          We couldn&apos;t find songs or artists for &quot;{query}&quot;.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/*
      |--------------------------------------------------------------------------
      | Artists
      |--------------------------------------------------------------------------
      */}

      {hasArtists && (
        <section className="mb-12">
          <h2 className="mb-5 text-2xl font-black text-white">Artists</h2>

          <div
            className="
              grid
              grid-cols-2
              gap-3
              sm:grid-cols-3
              lg:grid-cols-4
              xl:grid-cols-6
            "
          >
            {artists.map((artist) => (
              <Link
                key={artist.artistId}
                href={`/artist/${artist.artistId}`}
                className="
                    group
                    min-w-0
                    rounded-lg
                    p-3
                    transition
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
                        group-hover:translate-y-0
                        group-hover:opacity-100
                      "
                  >
                    ▶
                  </div>
                </div>

                <h3 className="mt-4 truncate font-bold text-white">
                  {artist.artistName}
                </h3>

                <p className="mt-1 text-sm text-neutral-400">Artist</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/*
      |--------------------------------------------------------------------------
      | Songs
      |--------------------------------------------------------------------------
      */}

      {hasTracks && (
        <section>
          <h2 className="mb-5 text-2xl font-black text-white">Songs</h2>

          <TrackGrid tracks={tracks} />

          {hasMore && (
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                disabled={loading}
                onClick={loadMore}
                className="
                  rounded-full
                  border
                  border-neutral-500
                  px-7
                  py-3
                  font-bold
                  text-white
                  transition
                  hover:border-white
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                {loading ? "Loading..." : "Load more songs"}
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
