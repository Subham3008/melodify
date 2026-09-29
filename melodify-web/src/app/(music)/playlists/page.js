"use client";

import {
  useEffect,
} from "react";

import Link from "next/link";

import {
  useAuthStore,
} from "@/presentation/stores/auth.store";

import {
  usePlaylistStore,
} from "@/presentation/stores/playlist.store";

import CreatePlaylistForm from "@/presentation/components/playlist/CreatePlaylistForm";

import PlaylistCard from "@/presentation/components/playlist/PlaylistCard";

export default function PlaylistsPage() {
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

  const playlists =
    usePlaylistStore(
      (state) =>
        state.playlists,
    );

  const initialized =
    usePlaylistStore(
      (state) =>
        state.initialized,
    );

  const loading =
    usePlaylistStore(
      (state) =>
        state.loading,
    );

  const fetchPlaylists =
    usePlaylistStore(
      (state) =>
        state.fetchPlaylists,
    );

  useEffect(() => {
    if (
      user &&
      !initialized
    ) {
      fetchPlaylists();
    }
  }, [
    user,
    initialized,
    fetchPlaylists,
  ]);

  if (authLoading) {
    return (
      <main className="min-h-screen bg-[#121212] p-8 text-white">
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
          items-center
          justify-center
          bg-[#121212]
          text-white
        "
      >
        <Link
          href="/login"
          className="
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
    <div
      className="
        min-h-full
      "
    >
      {/* <header
        className="
          border-b
          border-neutral-800
          px-8
          py-5
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
          <h1
            className="
              text-2xl
              font-black
            "
          >
            Playlists
          </h1>

          <Link
            href="/"
            className="
              text-neutral-300
              hover:text-white
            "
          >
            ← Home
          </Link>
        </div>
      </header> */}

      <section
        className="
          mx-auto
          grid
          max-w-7xl
          gap-8
          px-8
          py-8
          lg:grid-cols-[320px_1fr]
        "
      >
        <CreatePlaylistForm />

        <div>
          <h2
            className="
              mb-6
              text-3xl
              font-black
            "
          >
            Your Playlists
          </h2>

          {loading &&
            playlists.length ===
            0 ? (
            <p className="text-neutral-400">
              Loading playlists...
            </p>
          ) : playlists.length ===
            0 ? (
            <p className="text-neutral-400">
              Create your first playlist.
            </p>
          ) : (
            <div
              className="
                grid
                grid-cols-[repeat(auto-fill,minmax(190px,220px))]
                gap-5
              "
            >
              {playlists.map(
                (
                  playlist,
                ) => (
                  <PlaylistCard
                    key={
                      playlist.id
                    }
                    playlist={
                      playlist
                    }
                  />
                ),
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}