"use client";

import { usePlayerStore } from "@/presentation/stores/player.store";
import LikeButton from "@/presentation/components/like/LikeButton";
import AddToPlaylistButton from "@/presentation/components/playlist/AddToPlaylistButton";

export default function TrackCard({ track, queue = [], onRemove }) {
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
        <div
          className="
              absolute
              top-3
              right-3
              flex
              gap-2
            "
        >
          <AddToPlaylistButton track={track} />

          <LikeButton track={track} />
        </div>

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
        {onRemove && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();

              onRemove();
            }}
            className="
                mt-3
                text-xs
                font-semibold
                text-red-400
                hover:text-red-300
              "
          >
            Remove from playlist
          </button>
        )}
      </div>
    </article>
  );
}
