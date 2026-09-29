"use client";

import { usePlayerStore } from "@/presentation/stores/player.store";

function formatDuration(seconds = 0) {
  if (!seconds) {
    return "0:00";
  }

  const minutes = Math.floor(seconds / 60);

  const remainingSeconds = Math.floor(seconds % 60);

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

export default function NowPlayingSidebar() {
  const currentTrack = usePlayerStore((state) => state.currentTrack);

  const queue = usePlayerStore((state) => state.queue);

  const currentIndex = usePlayerStore((state) => state.currentIndex);

  const nextTrack = currentIndex >= 0 ? queue[currentIndex + 1] : null;

  /*
  |--------------------------------------------------------------------------
  | Nothing playing
  |--------------------------------------------------------------------------
  */

  if (!currentTrack) {
    return (
      <aside
        className="
            flex
            h-full
            min-h-0
            flex-col
            overflow-y-auto
            rounded-xl
            bg-[#121212]
            p-5
          "
      >
        <h2
          className="
            text-lg
            font-bold
          "
        >
          Now Playing
        </h2>

        <div
          className="
            flex
            flex-1
            flex-col
            items-center
            justify-center
            text-center
          "
        >
          <div
            className="
              flex
              h-28
              w-28
              items-center
              justify-center
              rounded-xl
              bg-[#242424]
              text-4xl
            "
          >
            ♪
          </div>

          <p
            className="
              mt-5
              text-sm
              font-semibold
              text-neutral-300
            "
          >
            Nothing playing
          </p>

          <p
            className="
              mt-2
              max-w-55
              text-xs
              leading-5
              text-neutral-500
            "
          >
            Play a song and its details will appear here.
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className="
        now-playing-scroll
        h-full
        min-h-0
        overflow-y-auto
        overscroll-contain
        rounded-xl
        bg-[#121212]
        p-4
        pr-3
      "
    >
      <h2
        className="
          mb-5
          truncate
          text-base
          font-bold
        "
      >
        {currentTrack.title}
      </h2>

      {/* CURRENT SONG IMAGE */}

      <div
        className="
          aspect-square
          w-full
          overflow-hidden
          rounded-xl
          bg-[#242424]
        "
      >
        {currentTrack.imageUrl ? (
          <img
            src={currentTrack.imageUrl}
            alt={currentTrack.title}
            className="
              h-full
              w-full
              object-cover
            "
          />
        ) : (
          <div
            className="
              flex
              h-full
              items-center
              justify-center
              text-6xl
            "
          >
            ♪
          </div>
        )}
      </div>

      {/* TRACK INFO */}

      <div className="mt-5">
        <h3
          className="
            text-xl
            font-bold
            leading-tight
          "
        >
          {currentTrack.title}
        </h3>

        <p
          className="
            mt-2
            text-sm
            text-neutral-400
          "
        >
          {currentTrack.artistName}
        </p>

        {currentTrack.albumName && (
          <p
            className="
              mt-1
              text-xs
              text-neutral-500
            "
          >
            {currentTrack.albumName}
          </p>
        )}
      </div>

      {/* DETAILS CARD */}

      <div
        className="
          mt-6
          rounded-xl
          bg-[#242424]
          p-4
        "
      >
        <p
          className="
            text-xs
            font-bold
            uppercase
            tracking-wide
            text-neutral-400
          "
        >
          Track details
        </p>

        <div
          className="
            mt-4
            flex
            justify-between
            text-sm
          "
        >
          <span
            className="
              text-neutral-400
            "
          >
            Duration
          </span>

          <span>{formatDuration(currentTrack.durationSeconds)}</span>
        </div>

        <div
          className="
            mt-3
            flex
            justify-between
            gap-4
            text-sm
          "
        >
          <span
            className="
              text-neutral-400
            "
          >
            Source
          </span>

          <span className="capitalize">{currentTrack.source}</span>
        </div>
      </div>

      {/* NEXT TRACK */}

      {nextTrack && (
        <div
          className="
            mt-4
            rounded-xl
            bg-[#242424]
            p-4
          "
        >
          <p
            className="
              text-xs
              font-bold
              uppercase
              tracking-wide
              text-neutral-400
            "
          >
            Next in queue
          </p>

          <div
            className="
              mt-3
              flex
              items-center
              gap-3
            "
          >
            {nextTrack.imageUrl && (
              <img
                src={nextTrack.imageUrl}
                alt={nextTrack.title}
                className="
                  h-12
                  w-12
                  rounded
                  object-cover
                "
              />
            )}

            <div className="min-w-0">
              <p
                className="
                  truncate
                  text-sm
                  font-semibold
                "
              >
                {nextTrack.title}
              </p>

              <p
                className="
                  mt-1
                  truncate
                  text-xs
                  text-neutral-400
                "
              >
                {nextTrack.artistName}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
