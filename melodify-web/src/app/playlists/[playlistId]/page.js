"use client";

import { useEffect } from "react";

import { useParams } from "next/navigation";

import Link from "next/link";

import { usePlaylistStore } from "@/presentation/stores/playlist.store";

import TrackGrid from "@/presentation/components/track/TrackGrid";

export default function PlaylistDetailsPage() {
  const params = useParams();

  const playlistId = params.playlistId;

  const playlist = usePlaylistStore((state) => state.currentPlaylist);

  const loading = usePlaylistStore((state) => state.detailsLoading);

  const error = usePlaylistStore((state) => state.error);

  const fetchPlaylist = usePlaylistStore((state) => state.fetchPlaylist);

  const removeTrack = usePlaylistStore((state) => state.removeTrack);

  useEffect(() => {
    if (playlistId) {
      fetchPlaylist(playlistId);
    }
  }, [playlistId, fetchPlaylist]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#121212] p-8 text-white">
        Loading playlist...
      </main>
    );
  }

  if (error || !playlist) {
    return (
      <main className="min-h-screen bg-[#121212] p-8 text-white">
        <p>{error || "Playlist not found"}</p>

        <Link
          href="/playlists"
          className="
            mt-4
            inline-block
            text-[#1ed760]
          "
        >
          ← Playlists
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
          px-8
          py-5
        "
      >
        <div
          className="
            mx-auto
            flex
            max-w-7xl
            justify-between
          "
        >
          <Link
            href="/playlists"
            className="
              text-neutral-300
              hover:text-white
            "
          >
            ← Playlists
          </Link>

          <Link
            href="/"
            className="
              text-neutral-300
              hover:text-white
            "
          >
            Home
          </Link>
        </div>
      </header>

      <section
        className="
          mx-auto
          max-w-7xl
          px-8
          py-10
        "
      >
        <p
          className="
            text-sm
            font-bold
            text-[#1ed760]
          "
        >
          PLAYLIST
        </p>

        <h1
          className="
            mt-2
            text-5xl
            font-black
          "
        >
          {playlist.name}
        </h1>

        {playlist.description && (
          <p
            className="
              mt-3
              text-neutral-400
            "
          >
            {playlist.description}
          </p>
        )}

        <p
          className="
            mt-3
            text-sm
            text-neutral-500
          "
        >
          {playlist.trackCount} {playlist.trackCount === 1 ? "song" : "songs"}
        </p>

        <div className="mt-10">
          <TrackGrid
            tracks={playlist.tracks}
            onRemoveTrack={(trackId) => removeTrack(playlistId, trackId)}
          />
        </div>
      </section>
    </main>
  );
}
