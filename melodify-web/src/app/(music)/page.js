"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAuthStore } from "@/presentation/stores/auth.store";
import { useTrackStore } from "@/presentation/stores/track.store";
import TrackGrid from "@/presentation/components/track/TrackGrid";
import RecentlyPlayed from "@/presentation/components/history/RecentlyPlayed";
import { useSearchParams } from "next/navigation";
import RecommendedForYou from "@/presentation/components/recommendation/RecommendedForYou";

export default function HomePage() {
  const searchParams = useSearchParams();

  const urlSearchQuery = searchParams.get("search")?.trim() ?? "";

  const user = useAuthStore((state) => state.user);

  const authLoading = useAuthStore((state) => state.loading);

  const logout = useAuthStore((state) => state.logout);

  const tracks = useTrackStore((state) => state.tracks);

  const tracksLoading = useTrackStore((state) => state.loading);

  const error = useTrackStore((state) => state.error);

  const hasMore = useTrackStore((state) => state.hasMore);

  const fetchTracks = useTrackStore((state) => state.fetchTracks);

  useEffect(() => {
    if (authLoading || !user) {
      return;
    }

    fetchTracks({
      reset: true,
      search: urlSearchQuery,
    });
  }, [authLoading, user, urlSearchQuery, fetchTracks]);

  if (authLoading) {
    return (
      <main
        className="
          flex
          min-h-screen
          items-center
          justify-center
          bg-[#121212]
          text-white
        "
      >
        <p>Loading...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main
        className="
          flex
          min-h-screen
          flex-col
          items-center
          justify-center
          bg-[#121212]
          text-white
        "
      >
        <h1
          className="
            text-5xl
            font-black
          "
        >
          Melodify
        </h1>

        <p
          className="
            mt-4
            text-neutral-400
          "
        >
          Login to start listening.
        </p>

        <div className="mt-8 flex gap-4">
          <Link
            href="/login"
            className="
              rounded-full
              bg-[#1ed760]
              px-7
              py-3
              font-bold
              text-black
            "
          >
            Login
          </Link>

          <Link
            href="/register"
            className="
              rounded-full
              border
              border-neutral-500
              px-7
              py-3
              font-bold
            "
          >
            Register
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div
      className="
        min-h-full
      text-white
      "
    >
      <section
        className="
          mx-auto
          max-w-7xl
          px-6
          py-8
          md:px-8
        "
      >
        {!urlSearchQuery && (
          <>
            <RecentlyPlayed />

            <RecommendedForYou />
          </>
        )}
        <div
          className="
            mb-8
            flex
            flex-col
            gap-5
            md:flex-row
            md:items-end
            md:justify-between
          "
        >
          <div>
            <h2
              className="
                mt-1
                text-3xl
                font-black
                tracking-tight
                md:text-4xl
              "
            >
              {urlSearchQuery
                ? `Search results for "${urlSearchQuery}"`
                : "Discover music"}
            </h2>
          </div>
        </div>

        {error && (
          <div
            className="
              mb-6
              rounded-lg
              bg-red-950/50
              px-4
              py-3
              text-red-300
            "
          >
            {error}
          </div>
        )}

        {tracksLoading && tracks.length === 0 ? (
          <p className="text-neutral-400">Loading tracks...</p>
        ) : (
          <TrackGrid tracks={tracks} />
        )}

        {tracks.length > 0 && hasMore && (
          <div
            className="
                mt-10
                flex
                justify-center
              "
          >
            <button
              type="button"
              disabled={tracksLoading}
              onClick={() => fetchTracks()}
              className="
                  rounded-full
                  border
                  border-neutral-500
                  px-7
                  py-3
                  font-bold
                  transition
                  hover:border-white
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
            >
              {tracksLoading ? "Loading..." : "Load more"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
