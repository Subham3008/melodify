"use client";

import { usePlayerStore } from "@/presentation/stores/player.store";

export default function TrackCard({ track, queue = [] }) {
  const playTrack = usePlayerStore((state) => state.playTrack);

  const currentTrack = usePlayerStore((state) => state.currentTrack);

  const isPlaying = usePlayerStore((state) => state.isPlaying);

  const isCurrentTrack = currentTrack?.id === track.id;

  const minutes = Math.floor(track.durationSeconds / 60);

  const seconds = String(track.durationSeconds % 60).padStart(2, "0");

  const handlePlay = () => {
    playTrack(track, queue);
  };

  return (
    <article
      className="
        group
        rounded-lg
        bg-[#181818]
        p-4
        transition
        duration-200
        hover:bg-[#282828]
      "
    >
      <div className="relative">
        <img
          src={track.imageUrl}
          alt={track.title}
          className="
            aspect-square
            w-full
            rounded-md
            object-cover
            shadow-lg
          "
        />

        <button
          type="button"
          onClick={handlePlay}
          className="
            absolute
            right-3
            bottom-3
            flex
            h-12
            w-12
            items-center
            justify-center
            rounded-full
            bg-[#1ed760]
            text-lg
            text-black
            shadow-xl
            transition
            duration-200
            group-hover:scale-105
          "
          aria-label={`Play ${track.title}`}
        >
          {isCurrentTrack && isPlaying ? "♪" : "▶"}
        </button>
      </div>

      <div className="mt-4">
        <h3
          className={`
            truncate
            font-bold
            ${isCurrentTrack ? "text-[#1ed760]" : "text-white"}
          `}
        >
          {track.title}
        </h3>

        <p
          className="
            mt-1
            truncate
            text-sm
            text-neutral-400
          "
        >
          {track.artistName}
        </p>

        <div
          className="
            mt-2
            flex
            items-center
            justify-between
            gap-3
            text-xs
            text-neutral-500
          "
        >
          <span className="truncate">{track.albumName || "Single"}</span>

          <span className="shrink-0">
            {minutes}:{seconds}
          </span>
        </div>
      </div>
    </article>
  );
}
