"use client";

import { useEffect, useRef, useState } from "react";

import { usePlayerStore } from "@/presentation/stores/player.store";

const formatTime = (seconds) => {
  if (!Number.isFinite(seconds)) {
    return "0:00";
  }

  const minutes = Math.floor(seconds / 60);

  const remainingSeconds = Math.floor(seconds % 60);

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
};

export default function GlobalPlayer() {
  const audioRef = useRef(null);

  const currentTrack = usePlayerStore((state) => state.currentTrack);

  const isPlaying = usePlayerStore((state) => state.isPlaying);

  const volume = usePlayerStore((state) => state.volume);

  const togglePlay = usePlayerStore((state) => state.togglePlay);

  const playNext = usePlayerStore((state) => state.playNext);

  const playPrevious = usePlayerStore((state) => state.playPrevious);

  const setVolume = usePlayerStore((state) => state.setVolume);

  const setIsPlaying = usePlayerStore((state) => state.setIsPlaying);

  const [currentTime, setCurrentTime] = useState(0);

  const [duration, setDuration] = useState(0);

  const [buffering, setBuffering] = useState(false);

  const [playerError, setPlayerError] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | Load new track
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio || !currentTrack) {
      return;
    }

    setCurrentTime(0);
    setDuration(0);
    setPlayerError(null);
    setBuffering(true);

    audio.src = currentTrack.streamUrl;

    audio.load();
  }, [currentTrack]);

  /*
  |--------------------------------------------------------------------------
  | Play / Pause
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio || !currentTrack) {
      return;
    }

    if (isPlaying) {
      audio.play().catch((error) => {
        // User ne play complete hone se pehle
        // pause kar diya.
        // Ye actual playback error nahi hai.
        if (error.name === "AbortError") {
          return;
        }

        console.error("Audio playback failed:", error);

        setIsPlaying(false);

        setPlayerError("Unable to play this track.");
      });
    } else {
      audio.pause();

      setBuffering(false);
    }
  }, [isPlaying, currentTrack, setIsPlaying]);

  /*
  |--------------------------------------------------------------------------
  | Volume
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!audioRef.current) {
      return;
    }

    audioRef.current.volume = volume;
  }, [volume]);

  /*
  |--------------------------------------------------------------------------
  | Previous
  |--------------------------------------------------------------------------
  */

  const handlePrevious = () => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    // Spotify-style behavior:
    // if more than 3 sec played,
    // restart current song.
    if (audio.currentTime > 3) {
      audio.currentTime = 0;

      setCurrentTime(0);

      return;
    }

    playPrevious();
  };

  /*
  |--------------------------------------------------------------------------
  | Seek
  |--------------------------------------------------------------------------
  */

  const handleSeek = (event) => {
    const newTime = Number(event.target.value);

    if (!audioRef.current) {
      return;
    }

    audioRef.current.currentTime = newTime;

    setCurrentTime(newTime);
  };

  /*
  |--------------------------------------------------------------------------
  | Volume
  |--------------------------------------------------------------------------
  */

  const handleVolume = (event) => {
    const newVolume = Number(event.target.value);

    setVolume(newVolume);
  };

  if (!currentTrack) {
    return null;
  }

  return (
    <>
      <audio
        ref={audioRef}
        preload="metadata"
        onLoadedMetadata={(event) => {
          setDuration(event.currentTarget.duration || 0);
        }}
        onTimeUpdate={(event) => {
          setCurrentTime(event.currentTarget.currentTime);
        }}
        onWaiting={() => {
          setBuffering(true);
        }}
        onPlaying={() => {
          setBuffering(false);
          setPlayerError(null);
        }}
        onCanPlay={() => {
          setBuffering(false);
        }}
        onEnded={() => {
          playNext();
        }}
        onError={() => {
          setBuffering(false);

          setIsPlaying(false);

          setPlayerError("This track could not be played.");
        }}
      />

      <footer
        className="
          fixed
          right-0
          bottom-0
          left-0
          z-50
          border-t
          border-neutral-800
          bg-[#181818]
          px-4
          py-3
          text-white
          shadow-2xl
        "
      >
        <div
          className="
            mx-auto
            flex
            max-w-7xl
            items-center
            gap-4
          "
        >
          {/* LEFT:
              TRACK INFORMATION */}

          <div
            className="
              flex
              min-w-0
              flex-1
              items-center
              gap-3
            "
          >
            <img
              src={currentTrack.imageUrl}
              alt={currentTrack.title}
              className="
                h-14
                w-14
                shrink-0
                rounded
                object-cover
              "
            />

            <div
              className="
                min-w-0
              "
            >
              <p
                className="
                  truncate
                  text-sm
                  font-semibold
                "
              >
                {currentTrack.title}
              </p>

              <p
                className="
                  truncate
                  text-xs
                  text-neutral-400
                "
              >
                {currentTrack.artistName}
              </p>

              {buffering && (
                <p
                  className="
                    text-xs
                    text-[#1ed760]
                  "
                >
                  Buffering...
                </p>
              )}

              {playerError && (
                <p
                  className="
                    truncate
                    text-xs
                    text-red-400
                  "
                >
                  {playerError}
                </p>
              )}
            </div>
          </div>

          {/* CENTER:
              CONTROLS + PROGRESS */}

          <div
            className="
              flex
              w-full
              max-w-xl
              flex-2
              flex-col
              items-center
              gap-2
            "
          >
            <div
              className="
                flex
                items-center
                gap-5
              "
            >
              <button
                type="button"
                onClick={handlePrevious}
                className="
                  text-xl
                  text-neutral-300
                  transition
                  hover:text-white
                "
                aria-label="Previous track"
              >
                ⏮
              </button>

              <button
                type="button"
                onClick={togglePlay}
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-full
                  bg-white
                  text-lg
                  text-black
                  transition
                  hover:scale-105
                "
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? "⏸" : "▶"}
              </button>

              <button
                type="button"
                onClick={playNext}
                className="
                  text-xl
                  text-neutral-300
                  transition
                  hover:text-white
                "
                aria-label="Next track"
              >
                ⏭
              </button>
            </div>

            <div
              className="
                flex
                w-full
                items-center
                gap-3
              "
            >
              <span
                className="
                  w-10
                  text-right
                  text-xs
                  text-neutral-400
                "
              >
                {formatTime(currentTime)}
              </span>

              <input
                type="range"
                min="0"
                max={duration || 0}
                step="0.1"
                value={Math.min(currentTime, duration || 0)}
                onChange={handleSeek}
                className="
                  h-1
                  flex-1
                  cursor-pointer
                  accent-white
                "
                aria-label="Track progress"
              />

              <span
                className="
                  w-10
                  text-xs
                  text-neutral-400
                "
              >
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* RIGHT:
              VOLUME */}

          <div
            className="
              hidden
              flex-1
              items-center
              justify-end
              gap-2
              md:flex
            "
          >
            <span>{volume === 0 ? "🔇" : "🔊"}</span>

            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolume}
              className="
                w-28
                cursor-pointer
                accent-white
              "
              aria-label="Volume"
            />
          </div>
        </div>
      </footer>
    </>
  );
}
