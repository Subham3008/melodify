"use client";

import { useEffect } from "react";

import { useAuthStore } from "@/presentation/stores/auth.store";
import { useHistoryStore } from "@/presentation/stores/history.store";
import { usePlayerStore } from "@/presentation/stores/player.store";

export default function RecentlyPlayed() {
  /*
  |--------------------------------------------------------------------------
  | Auth
  |--------------------------------------------------------------------------
  */

  const user = useAuthStore((state) => state.user);

  /*
  |--------------------------------------------------------------------------
  | History
  |--------------------------------------------------------------------------
  */

  const recentTracks = useHistoryStore((state) => state.recentTracks);

  const loading = useHistoryStore((state) => state.loading);

  const initialized = useHistoryStore((state) => state.initialized);

  const fetchRecentlyPlayed = useHistoryStore(
    (state) => state.fetchRecentlyPlayed,
  );

  /*
  |--------------------------------------------------------------------------
  | Player
  |--------------------------------------------------------------------------
  */

  const currentTrack = usePlayerStore((state) => state.currentTrack);

  const isPlaying = usePlayerStore((state) => state.isPlaying);

  const playTrack = usePlayerStore((state) => state.playTrack);

  const togglePlay = usePlayerStore((state) => state.togglePlay);

  /*
  |--------------------------------------------------------------------------
  | Fetch recently played tracks
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (user && !initialized) {
      fetchRecentlyPlayed(8);
    }
  }, [user, initialized, fetchRecentlyPlayed]);

  /*
  |--------------------------------------------------------------------------
  | Not logged in
  |--------------------------------------------------------------------------
  */

  if (!user) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | Loading skeleton
  |--------------------------------------------------------------------------
  */

  if (loading && recentTracks.length === 0) {
    return (
      <section className="mb-10">
        <h2
          className="
            mb-5
            text-2xl
            font-black
            text-white
          "
        >
          Recently Played
        </h2>

        <div
          className="
            grid
            grid-cols-1
            gap-3
            md:grid-cols-2
          "
        >
          {Array.from({
            length: 6,
          }).map((_, index) => (
            <div
              key={index}
              className="
                h-20
                animate-pulse
                rounded-lg
                bg-[#242424]
              "
            />
          ))}
        </div>
      </section>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Nothing played yet
  |--------------------------------------------------------------------------
  */

  if (recentTracks.length === 0) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | Play recent track
  |--------------------------------------------------------------------------
  */

  const handleTrackClick = (track) => {
    /*
    |--------------------------------------------------------------------------
    | Same track
    |--------------------------------------------------------------------------
    */

    if (currentTrack?.id === track.id) {
      togglePlay();

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | New track
    |--------------------------------------------------------------------------
    |
    | Recently Played becomes the active queue.
    |
    */

    playTrack(track, recentTracks);
  };

  return (
    <section className="mb-10">
      {/* HEADER */}

      <div className="mb-5">
        <h2
          className="
            text-2xl
            font-black
            text-white
          "
        >
          Recently Played
        </h2>

        <p
          className="
            mt-1
            text-sm
            text-neutral-400
          "
        >
          Jump back into your latest tracks
        </p>
      </div>

      {/* RECENT TRACKS */}

      <div
        className="
          grid
          grid-cols-1
          gap-3
          md:grid-cols-2
        "
      >
        {recentTracks.slice(0, 8).map((track) => {
          const isCurrentTrack = currentTrack?.id === track.id;

          return (
            <button
              key={track.id}
              type="button"
              onClick={() => handleTrackClick(track)}
              className="
                  group
                  relative
                  flex
                  min-w-0
                  items-center
                  overflow-hidden
                  rounded-lg
                  bg-[#242424]
                  text-left
                  transition
                  hover:bg-[#343434]
                "
            >
              {/* IMAGE */}

              <img
                src={track.imageUrl}
                alt={track.title}
                className="
                    h-20
                    w-20
                    shrink-0
                    object-cover
                  "
              />

              {/* TRACK INFO */}

              <div
                className="
                    min-w-0
                    flex-1
                    px-4
                    pr-14
                  "
              >
                <p
                  className={`
                      truncate
                      text-sm
                      font-bold

                      ${isCurrentTrack ? "text-[#1ed760]" : "text-white"}
                    `}
                >
                  {track.title}
                </p>

                <p
                  className="
                      mt-1
                      truncate
                      text-xs
                      text-neutral-400
                    "
                >
                  {track.artistName}
                </p>
              </div>

              {/* PLAY BUTTON */}

              <div
                className={`
                    absolute
                    right-4
                    flex
                    h-11
                    w-11
                    items-center
                    justify-center
                    rounded-full
                    bg-[#1ed760]
                    text-lg
                    text-black
                    shadow-xl
                    transition

                    ${
                      isCurrentTrack
                        ? "opacity-100"
                        : "translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
                    }
                  `}
              >
                {isCurrentTrack && isPlaying ? "⏸" : "▶"}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
