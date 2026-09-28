"use client";

import { useLikeStore } from "@/presentation/stores/like.store";

export default function LikeButton({ track }) {
  const likedTrackIds = useLikeStore((state) => state.likedTrackIds);

  const togglingIds = useLikeStore((state) => state.togglingIds);

  const toggleLike = useLikeStore((state) => state.toggleLike);

  const isLiked = likedTrackIds.includes(track.id);

  const isLoading = togglingIds.includes(track.id);

  return (
    <button
      type="button"
      disabled={isLoading}
      onClick={(event) => {
        event.stopPropagation();

        toggleLike(track);
      }}
      className={`
        flex
        h-9
        w-9
        items-center
        justify-center
        rounded-full
        bg-black/70
        text-xl
        transition
        hover:scale-110
        disabled:cursor-not-allowed
        disabled:opacity-50

        ${isLiked ? "text-[#1ed760]" : "text-white"}
      `}
      aria-label={isLiked ? `Unlike ${track.title}` : `Like ${track.title}`}
    >
      {isLiked ? "♥" : "♡"}
    </button>
  );
}
