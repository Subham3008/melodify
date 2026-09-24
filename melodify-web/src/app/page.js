"use client";

import Link from "next/link";
import {
  useEffect,
} from "react";

import {
  useAuthStore,
} from "@/presentation/stores/auth.store";

import {
  useTrackStore,
} from "@/presentation/stores/track.store";

import TrackGrid from "@/presentation/components/track/TrackGrid";

export default function HomePage() {
  const user = useAuthStore(
    (state) => state.user,
  );

  const authLoading =
    useAuthStore(
      (state) => state.loading,
    );

  const logout =
    useAuthStore(
      (state) => state.logout,
    );

  const tracks =
    useTrackStore(
      (state) => state.tracks,
    );

  const tracksLoading =
    useTrackStore(
      (state) => state.loading,
    );

  const error =
    useTrackStore(
      (state) => state.error,
    );

  const hasMore =
    useTrackStore(
      (state) => state.hasMore,
    );

  const fetchTracks =
    useTrackStore(
      (state) =>
        state.fetchTracks,
    );

  useEffect(() => {
    if (
      !authLoading &&
      user &&
      tracks.length === 0
    ) {
      fetchTracks({
        reset: true,
      });
    }
  }, [
    authLoading,
    user,
    tracks.length,
    fetchTracks,
  ]);

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
    <main
      className="
        min-h-screen
        bg-[#121212]
        text-white
      "
    >
      <header
        className="
          sticky
          top-0
          z-10
          flex
          items-center
          justify-between
          border-b
          border-neutral-800
          bg-[#121212]/95
          px-6
          py-4
          backdrop-blur
          md:px-8
        "
      >
        <h1
          className="
            text-2xl
            font-black
          "
        >
          Melodify
        </h1>

        <div
          className="
            flex
            items-center
            gap-4
          "
        >
          <div
            className="
              hidden
              text-right
              sm:block
            "
          >
            <p
              className="
                text-sm
                font-semibold
              "
            >
              {user.name}
            </p>

            <p
              className="
                text-xs
                text-neutral-400
              "
            >
              {user.email}
            </p>
          </div>

          {user.avatarUrl && (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="
                h-10
                w-10
                rounded-full
                object-cover
              "
            />
          )}

          <button
            onClick={logout}
            className="
              rounded-full
              border
              border-neutral-600
              px-4
              py-2
              text-sm
              font-bold
              transition
              hover:border-white
            "
          >
            Logout
          </button>
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
              text-neutral-400
            "
          >
            Welcome back,
            {" "}
            {user.name}
          </p>

          <h2
            className="
              mt-1
              text-3xl
              font-black
              tracking-tight
              md:text-4xl
            "
          >
            Discover music
          </h2>
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

        {tracksLoading &&
          tracks.length === 0 ? (
          <p className="text-neutral-400">
            Loading tracks...
          </p>
        ) : (
          <TrackGrid
            tracks={tracks}
          />
        )}

        {tracks.length > 0 &&
          hasMore && (
            <div
              className="
                mt-10
                flex
                justify-center
              "
            >
              <button
                type="button"
                disabled={
                  tracksLoading
                }
                onClick={() =>
                  fetchTracks()
                }
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
                {tracksLoading
                  ? "Loading..."
                  : "Load more"}
              </button>
            </div>
          )}
      </section>
    </main>
  );
}