"use client";

import Link from "next/link";

import { usePlaylistStore } from "@/presentation/stores/playlist.store";

export default function PlaylistCard({ playlist }) {
  const deletePlaylist = usePlaylistStore((state) => state.deletePlaylist);

  const handleDelete = async (event) => {
    event.preventDefault();

    event.stopPropagation();

    const confirmed = window.confirm(`Delete "${playlist.name}"?`);

    if (!confirmed) {
      return;
    }

    await deletePlaylist(playlist.id);
  };

  return (
    <Link
      href={`/playlists/${playlist.id}`}
      className="
        block
        rounded-xl
        bg-[#181818]
        p-5
        transition
        hover:bg-[#282828]
      "
    >
      <div
        className="
          flex
          aspect-square
          items-center
          justify-center
          rounded-lg
          bg-neutral-800
          text-6xl
        "
      >
        🎵
      </div>

      <div className="mt-4">
        <h2
          className="
            truncate
            font-bold
          "
        >
          {playlist.name}
        </h2>

        <p
          className="
            mt-1
            text-sm
            text-neutral-400
          "
        >
          {playlist.trackCount} {playlist.trackCount === 1 ? "song" : "songs"}
        </p>

        {playlist.description && (
          <p
            className="
              mt-2
              line-clamp-2
              text-sm
              text-neutral-500
            "
          >
            {playlist.description}
          </p>
        )}

        <button
          type="button"
          onClick={handleDelete}
          className="
            mt-4
            text-xs
            font-semibold
            text-red-400
            hover:text-red-300
          "
        >
          Delete
        </button>
      </div>
    </Link>
  );
}
