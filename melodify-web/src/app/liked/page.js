"use client";

import Link from "next/link";

import {
  useAuthStore,
} from "@/presentation/stores/auth.store";

import {
  useLikeStore,
} from "@/presentation/stores/like.store";

import TrackGrid from "@/presentation/components/track/TrackGrid";

export default function LikedSongsPage() {
  const user =
    useAuthStore(
      (state) =>
        state.user,
    );

  const authLoading =
    useAuthStore(
      (state) =>
        state.loading,
    );

  const likedTracks =
    useLikeStore(
      (state) =>
        state.likedTracks,
    );

  const likesLoading =
    useLikeStore(
      (state) =>
        state.loading,
    );

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
        Loading...
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
            text-3xl
            font-bold
          "
        >
          Login required
        </h1>

        <Link
          href="/login"
          className="
            mt-6
            rounded-full
            bg-[#1ed760]
            px-6
            py-3
            font-bold
            text-black
          "
        >
          Login
        </Link>
      </main>
    );
  }

  return (
    <main
      className="
        min-h-screen
        bg-[#121212]
        pb-32
        text-white
      "
    >
      <header
        className="
          border-b
          border-neutral-800
          px-6
          py-5
          md:px-8
        "
      >
        <div
          className="
            mx-auto
            flex
            max-w-7xl
            items-center
            justify-between
          "
        >
          <Link
            href="/"
            className="
              text-2xl
              font-black
            "
          >
            Melodify
          </Link>

          <Link
            href="/"
            className="
              text-sm
              text-neutral-300
              transition
              hover:text-white
            "
          >
            ← Home
          </Link>
        </div>
      </header>

      <section
        className="
          mx-auto
          max-w-7xl
          px-6
          py-8
          md:px-8
        "
      >
        <div className="mb-8">
          <p
            className="
              text-sm
              font-semibold
              text-[#1ed760]
            "
          >
            YOUR LIBRARY
          </p>

          <h1
            className="
              mt-2
              text-4xl
              font-black
              md:text-5xl
            "
          >
            Liked Songs
          </h1>

          <p
            className="
              mt-3
              text-neutral-400
            "
          >
            {likedTracks.length}{" "}
            {likedTracks.length ===
              1
              ? "song"
              : "songs"}
          </p>
        </div>

        {likesLoading &&
          likedTracks.length ===
          0 ? (
          <p
            className="
              text-neutral-400
            "
          >
            Loading liked songs...
          </p>
        ) : (
          <TrackGrid
            tracks={
              likedTracks
            }
          />
        )}
      </section>
    </main>
  );
}