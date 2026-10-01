"use client";

import { useEffect } from "react";
import Link from "next/link";

import { useAuthStore } from "@/presentation/stores/auth.store";
import { usePlaylistStore } from "@/presentation/stores/playlist.store";

import CreatePlaylistForm from "@/presentation/components/playlist/CreatePlaylistForm";
import PlaylistCard from "@/presentation/components/playlist/PlaylistCard";

export default function PlaylistsPage() {
  const user = useAuthStore(
    (state) => state.user,
  );

  const authLoading = useAuthStore(
    (state) => state.loading,
  );

  const playlists = usePlaylistStore(
    (state) => state.playlists,
  );

  const initialized = usePlaylistStore(
    (state) => state.initialized,
  );

  const loading = usePlaylistStore(
    (state) => state.loading,
  );

  const fetchPlaylists = usePlaylistStore(
    (state) => state.fetchPlaylists,
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
    <div className="min-h-full">
      <section
        className="
          mx-auto
          grid
          max-w-7xl
          items-start
          gap-8
          px-8
          pb-12
          lg:grid-cols-[320px_minmax(0,1fr)]
        "
      >
        {/* ================================================================
            LEFT SIDE
            Create form stays sticky while playlists scroll
        ================================================================= */}

        <div
          className="
            sticky
            top-20
            self-start
            pt-8
          "
        >
          <h2
            className="
              mb-6
              text-3xl
              font-black
              text-white
            "
          >
            Create Playlist
          </h2>

          <CreatePlaylistForm />
        </div>

        {/* ================================================================
            RIGHT SIDE
        ================================================================= */}

        <div className="min-w-0">
          {/* ==============================================================
              STICKY PLAYLIST HEADER
          =============================================================== */}

          <div
            className="
              sticky
              top-20
              z-20
              -mx-3
              bg-[#121212]/80
              px-3
              pt-8
              pb-5
              backdrop-blur-xl
            "
          >
            <h2
              className="
                text-3xl
                font-black
                text-white
              "
            >
              Your Playlists
            </h2>
          </div>

          {/* ==============================================================
              PLAYLIST CONTENT
          =============================================================== */}

          {loading &&
            playlists.length === 0 ? (
            <p className="text-neutral-400">
              Loading playlists...
            </p>
          ) : playlists.length === 0 ? (
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
                (playlist) => (
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