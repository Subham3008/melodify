"use client";

import { useEffect, useRef, useState } from "react";

import { useTrackStore } from "@/presentation/stores/track.store";

export default function TrackSearchBar() {
  const searchQuery = useTrackStore((state) => state.searchQuery);

  const fetchTracks = useTrackStore((state) => state.fetchTracks);

  const [value, setValue] = useState(searchQuery);

  const isFirstRender = useRef(true);

  /*
  |--------------------------------------------------------------------------
  | Debounced search
  |--------------------------------------------------------------------------
  |
  | User:
  |
  | r
  | ro
  | roc
  | rock
  |
  | Har key press pe API call nahi.
  |
  | User typing stop karega 450ms
  | then API request jayegi.
  |
  */

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;

      return;
    }

    const timer = setTimeout(() => {
      fetchTracks({
        reset: true,

        search: value,
      });
    }, 450);

    return () => {
      clearTimeout(timer);
    };
  }, [value, fetchTracks]);

  const handleClear = () => {
    setValue("");
  };

  return (
    <div
      className="
        relative
        w-full
        max-w-md
      "
    >
      <span
        className="
          absolute
          top-1/2
          left-4
          -translate-y-1/2
          text-neutral-400
        "
      >
        🔍
      </span>

      <input
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search songs, artists or albums"
        className="
          w-full
          rounded-full
          border
          border-neutral-700
          bg-[#242424]
          py-3
          pr-12
          pl-11
          text-sm
          text-white
          outline-none
          transition
          placeholder:text-neutral-500
          focus:border-neutral-400
          focus:bg-[#2a2a2a]
        "
      />

      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="
            absolute
            top-1/2
            right-4
            -translate-y-1/2
            text-neutral-400
            transition
            hover:text-white
          "
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  );
}
