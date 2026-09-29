"use client";

import { useState } from "react";

import Link from "next/link";

import { usePlaylistStore } from "@/presentation/stores/playlist.store";

export default function AddToPlaylistButton({ track }) {
  const [open, setOpen] = useState(false);

  const [message, setMessage] = useState("");

  const playlists = usePlaylistStore((state) => state.playlists);

  const initialized = usePlaylistStore((state) => state.initialized);

  const loading = usePlaylistStore((state) => state.loading);

  const fetchPlaylists = usePlaylistStore((state) => state.fetchPlaylists);

  const addTrack = usePlaylistStore((state) => state.addTrack);

  const handleOpen = async (event) => {
    event.stopPropagation();

    const nextOpen = !open;

    setOpen(nextOpen);

    setMessage("");

    if (nextOpen && !initialized) {
      await fetchPlaylists();
    }
  };

  const handleAdd = async (event, playlistId) => {
    event.stopPropagation();

    const added = await addTrack(playlistId, track);

    setMessage(added ? "Added ✓" : "Already added");
  };

  return (
    <div className="relative" onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        onClick={handleOpen}
        className="
          flex
          h-9
          w-9
          items-center
          justify-center
          rounded-full
          bg-black/70
          text-xl
          text-white
          transition
          hover:scale-110
        "
        aria-label={`Add ${track.title} to playlist`}
      >
        +
      </button>

      {open && (
        <div
          className="
            absolute
            top-11
            right-0
            z-40
            w-56
            rounded-lg
            border
            border-neutral-700
            bg-[#282828]
            p-2
            shadow-2xl
          "
        >
          <p
            className="
              px-3
              py-2
              text-xs
              font-bold
              text-neutral-400
            "
          >
            ADD TO PLAYLIST
          </p>

          {loading ? (
            <p className="px-3 py-2 text-sm">Loading...</p>
          ) : playlists.length === 0 ? (
            <div className="px-3 py-2">
              <p
                className="
                  text-sm
                  text-neutral-400
                "
              >
                No playlists yet.
              </p>

              <Link
                href="/playlists"
                className="
                  mt-2
                  inline-block
                  text-sm
                  font-semibold
                  text-[#1ed760]
                "
              >
                Create one
              </Link>
            </div>
          ) : (
            playlists.map((playlist) => (
              <button
                key={playlist.id}
                type="button"
                onClick={(event) => handleAdd(event, playlist.id)}
                className="
                    block
                    w-full
                    rounded
                    px-3
                    py-2
                    text-left
                    text-sm
                    hover:bg-neutral-700
                  "
              >
                {playlist.name}
              </button>
            ))
          )}

          {message && (
            <p
              className="
                px-3
                py-2
                text-xs
                text-[#1ed760]
              "
            >
              {message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
