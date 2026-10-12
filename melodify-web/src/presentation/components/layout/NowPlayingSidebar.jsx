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

  const isPlaying = usePlayerStore((state) => state.isPlaying);

  const playQueueTrack = usePlayerStore((state) => state.playQueueTrack);

  /*
  |--------------------------------------------------------------------------
  | Upcoming queue
  |--------------------------------------------------------------------------
  |
  | Current track ke baad jo tracks hain,
  | wahi Up Next me show honge.
  |
  */

  const upcomingTracks = currentIndex >= 0 ? queue.slice(currentIndex + 1) : [];

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
      {/*
      |--------------------------------------------------------------------------
      | Sidebar heading
      |--------------------------------------------------------------------------
      */}

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

      {/*
      |--------------------------------------------------------------------------
      | Current song image
      |--------------------------------------------------------------------------
      */}

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

      {/*
      |--------------------------------------------------------------------------
      | Track info
      |--------------------------------------------------------------------------
      */}

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

      {/*
      |--------------------------------------------------------------------------
      | Track details
      |--------------------------------------------------------------------------
      */}

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

      {/*
      |--------------------------------------------------------------------------
      | Queue
      |--------------------------------------------------------------------------
      */}

      <div
        className="
          mt-4
          rounded-xl
          bg-[#181818]
          p-3
        "
      >
        <div
          className="
            flex
            items-center
            justify-between
            gap-3
          "
        >
          <h3
            className="
              text-sm
              font-bold
              text-white
            "
          >
            Up Next
          </h3>

          <span
            className="
              text-xs
              text-neutral-500
            "
          >
            {upcomingTracks.length}{" "}
            {upcomingTracks.length === 1 ? "song" : "songs"}
          </span>
        </div>

        {/*
        |--------------------------------------------------------------------------
        | Current track
        |--------------------------------------------------------------------------
        */}

        <div className="mt-3">
          <p
            className="
              mb-2
              text-[11px]
              font-bold
              uppercase
              tracking-wide
              text-neutral-500
            "
          >
            Now playing
          </p>

          <div
            className="
              flex
              items-center
              gap-3
              rounded-lg
              bg-[#242424]
              px-2
              py-2
            "
          >
            {currentTrack.imageUrl ? (
              <img
                src={currentTrack.imageUrl}
                alt={currentTrack.title}
                className="
                  h-11
                  w-11
                  shrink-0
                  rounded
                  object-cover
                "
              />
            ) : (
              <div
                className="
                  flex
                  h-11
                  w-11
                  shrink-0
                  items-center
                  justify-center
                  rounded
                  bg-neutral-700
                  text-lg
                "
              >
                ♪
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p
                className="
                  truncate
                  text-sm
                  font-semibold
                  text-[#1ed760]
                "
              >
                {currentTrack.title}
              </p>

              <p
                className="
                  mt-0.5
                  truncate
                  text-xs
                  text-neutral-400
                "
              >
                {currentTrack.artistName}
              </p>
            </div>

            <div
              className="
                shrink-0
                text-sm
                text-[#1ed760]
              "
              aria-label={
                isPlaying ? "Currently playing" : "Current track paused"
              }
            >
              {isPlaying ? "♪" : "Ⅱ"}
            </div>
          </div>
        </div>

        {/*
        |--------------------------------------------------------------------------
        | Upcoming tracks
        |--------------------------------------------------------------------------
        */}

        {upcomingTracks.length > 0 ? (
          <div className="mt-4">
            <p
              className="
                mb-2
                text-[11px]
                font-bold
                uppercase
                tracking-wide
                text-neutral-500
              "
            >
              Next in queue
            </p>

            <div className="space-y-1">
              {upcomingTracks.map((track, relativeIndex) => {
                const queueIndex = currentIndex + relativeIndex + 1;

                return (
                  <button
                    key={`${track.id}-${queueIndex}`}
                    type="button"
                    onClick={() => playQueueTrack(queueIndex)}
                    className="
                        group
                        flex
                        w-full
                        items-center
                        gap-3
                        rounded-lg
                        px-2
                        py-2
                        text-left
                        transition
                        hover:bg-[#2a2a2a]
                      "
                    aria-label={`Play ${track.title}`}
                  >
                    {/*
                      |--------------------------------------------------------------------------
                      | Queue image
                      |--------------------------------------------------------------------------
                      */}

                    {track.imageUrl ? (
                      <img
                        src={track.imageUrl}
                        alt={track.title}
                        className="
                            h-11
                            w-11
                            shrink-0
                            rounded
                            object-cover
                          "
                      />
                    ) : (
                      <div
                        className="
                            flex
                            h-11
                            w-11
                            shrink-0
                            items-center
                            justify-center
                            rounded
                            bg-neutral-700
                            text-lg
                          "
                      >
                        ♪
                      </div>
                    )}

                    {/*
                      |--------------------------------------------------------------------------
                      | Queue track info
                      |--------------------------------------------------------------------------
                      */}

                    <div className="min-w-0 flex-1">
                      <p
                        className="
                            truncate
                            text-sm
                            font-semibold
                            text-neutral-200
                            transition
                            group-hover:text-white
                          "
                      >
                        {track.title}
                      </p>

                      <p
                        className="
                            mt-0.5
                            truncate
                            text-xs
                            text-neutral-500
                            transition
                            group-hover:text-neutral-400
                          "
                      >
                        {track.artistName}
                      </p>
                    </div>

                    {/*
                      |--------------------------------------------------------------------------
                      | Play hover indicator
                      |--------------------------------------------------------------------------
                      */}

                    <span
                      className="
                          shrink-0
                          text-xs
                          text-neutral-500
                          opacity-0
                          transition
                          group-hover:opacity-100
                        "
                    >
                      ▶
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div
            className="
              mt-4
              rounded-lg
              border
              border-white/5
              px-3
              py-4
              text-center
            "
          >
            <p
              className="
                text-xs
                text-neutral-500
              "
            >
              No more songs in the queue.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
