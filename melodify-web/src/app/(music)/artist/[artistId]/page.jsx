"use client";

import { use, useEffect } from "react";

import Link from "next/link";

import { useArtistStore } from "@/presentation/stores/artist.store";

import { usePlayerStore } from "@/presentation/stores/player.store";

import LikeButton from "@/presentation/components/like/LikeButton";

import AddToPlaylistButton from "@/presentation/components/playlist/AddToPlaylistButton";

const formatDuration = (durationSeconds) => {
  const totalSeconds = Math.max(Math.floor(Number(durationSeconds) || 0), 0);

  const minutes = Math.floor(totalSeconds / 60);

  const seconds = String(totalSeconds % 60).padStart(2, "0");

  return `${minutes}:${seconds}`;
};

export default function ArtistPage({ params }) {
  const { artistId } = use(params);

  const artist = useArtistStore((state) => state.artist);

  const tracks = useArtistStore((state) => state.tracks);

  const loading = useArtistStore((state) => state.loading);

  const error = useArtistStore((state) => state.error);

  const fetchArtist = useArtistStore((state) => state.fetchArtist);

  const clearArtist = useArtistStore((state) => state.clearArtist);

  const playTrack = usePlayerStore((state) => state.playTrack);

  const currentTrack = usePlayerStore((state) => state.currentTrack);

  const isPlaying = usePlayerStore((state) => state.isPlaying);

  const togglePlay = usePlayerStore((state) => state.togglePlay);

  /*
  |--------------------------------------------------------------------------
  | Fetch artist
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!artistId) {
      return;
    }

    void fetchArtist(artistId);

    return () => {
      clearArtist();
    };
  }, [artistId, fetchArtist, clearArtist]);

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="min-h-full bg-[#121212] p-8 text-neutral-400">
        Loading artist...
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Error
  |--------------------------------------------------------------------------
  */

  if (error || !artist) {
    return (
      <div className="min-h-full bg-[#121212] p-8">
        <p className="text-red-400">{error || "Artist not found"}</p>

        <Link
          href="/"
          className="
            mt-5
            inline-block
            font-semibold
            text-white
            hover:underline
          "
        >
          ← Back to Home
        </Link>
      </div>
    );
  }

  const artistQueueIsPlaying =
    tracks.some((track) => track.id === currentTrack?.id) && isPlaying;

  /*
  |--------------------------------------------------------------------------
  | Main artist Play button
  |--------------------------------------------------------------------------
  */

  const handlePlayArtist = () => {
    if (tracks.length === 0) {
      return;
    }

    /*
      |--------------------------------------------------------------------------
      | Current artist already playing
      |--------------------------------------------------------------------------
      */

    if (currentTrack && tracks.some((track) => track.id === currentTrack.id)) {
      togglePlay();

      return;
    }

    /*
      |--------------------------------------------------------------------------
      | Start artist queue from first track
      |--------------------------------------------------------------------------
      */

    playTrack(tracks[0], tracks);
  };

  return (
    <div className="min-h-full bg-[#121212] text-white">
      {/*
      |--------------------------------------------------------------------------
      | Hero
      |--------------------------------------------------------------------------
      */}

      <section
        className="
          relative
          overflow-hidden
          px-6
          pt-12
          pb-8
          md:px-8
          md:pt-16
        "
      >
        {artist.imageUrl ? (
          <>
            <img
              src={artist.imageUrl}
              alt=""
              aria-hidden="true"
              className="
                absolute
                inset-0
                h-full
                w-full
                scale-110
                object-cover
                opacity-40
                blur-3xl
              "
            />

            <div
              className="
                absolute
                inset-0
                bg-linear-to-t
                from-[#121212]
                via-black/40
                to-black/20
              "
            />
          </>
        ) : (
          <div
            className="
              absolute
              inset-0
              bg-linear-to-b
              from-neutral-600
              to-[#121212]
            "
          />
        )}

        <div
          className="
            relative
            z-10
            mx-auto
            flex
            max-w-7xl
            flex-col
            gap-7
            md:flex-row
            md:items-end
          "
        >
          {artist.imageUrl ? (
            <img
              src={artist.imageUrl}
              alt={artist.artistName}
              className="
                h-48
                w-48
                shrink-0
                rounded-full
                object-cover
                shadow-2xl
                md:h-56
                md:w-56
              "
            />
          ) : (
            <div
              className="
                flex
                h-48
                w-48
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-neutral-800
                text-7xl
                font-black
                shadow-2xl
                md:h-56
                md:w-56
              "
            >
              {artist.artistName?.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="min-w-0 pb-2">
            <p className="text-sm font-bold text-white">Artist</p>

            <h1
              className="
                mt-2
                wrap-break-word
                text-5xl
                font-black
                tracking-tight
                text-white
                md:text-7xl
                lg:text-8xl
              "
            >
              {artist.artistName}
            </h1>

            <p className="mt-5 text-sm font-medium text-neutral-200">
              {tracks.length} tracks
            </p>
          </div>
        </div>
      </section>

      {/*
      |--------------------------------------------------------------------------
      | Artist content
      |--------------------------------------------------------------------------
      */}

      <section
        className="
          mx-auto
          max-w-7xl
          px-6
          py-7
          md:px-8
        "
      >
        {/*
        |--------------------------------------------------------------------------
        | Main play action
        |--------------------------------------------------------------------------
        */}

        <div className="mb-10 flex items-center gap-5">
          <button
            type="button"
            onClick={handlePlayArtist}
            disabled={tracks.length === 0}
            className="
              flex
              h-14
              w-14
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-[#1ed760]
              text-xl
              text-black
              shadow-xl
              transition
              hover:scale-105
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
            aria-label={
              artistQueueIsPlaying
                ? `Pause ${artist.artistName}`
                : `Play ${artist.artistName}`
            }
          >
            {artistQueueIsPlaying ? "Ⅱ" : "▶"}
          </button>
        </div>

        {/*
        |--------------------------------------------------------------------------
        | Popular
        |--------------------------------------------------------------------------
        */}

        <div>
          <h2 className="mb-4 text-2xl font-black">Popular</h2>

          {tracks.length === 0 ? (
            <p className="text-neutral-400">No tracks available.</p>
          ) : (
            <div>
              {tracks.map((track, index) => {
                const isCurrent = currentTrack?.id === track.id;

                return (
                  <div
                    key={track.id}
                    className={`
                        group
                        grid
                        grid-cols-[36px_48px_minmax(0,1fr)_auto]
                        items-center
                        gap-4
                        rounded-md
                        px-3
                        py-2
                        transition
                        ${isCurrent ? "bg-white/5" : "hover:bg-white/10"}
                      `}
                  >
                    {/*
                      |--------------------------------------------------------------------------
                      | Number / playing indicator
                      |--------------------------------------------------------------------------
                      */}

                    <button
                      type="button"
                      onClick={() => playTrack(track, tracks)}
                      className="
                          flex
                          h-8
                          w-8
                          items-center
                          justify-center
                          text-sm
                          text-neutral-400
                        "
                      aria-label={`Play ${track.title}`}
                    >
                      {isCurrent && isPlaying ? (
                        <span className="text-[#1ed760]">♪</span>
                      ) : (
                        <>
                          <span className="group-hover:hidden">
                            {index + 1}
                          </span>

                          <span className="hidden text-white group-hover:inline">
                            ▶
                          </span>
                        </>
                      )}
                    </button>

                    {/*
                      |--------------------------------------------------------------------------
                      | Cover
                      |--------------------------------------------------------------------------
                      */}

                    <button
                      type="button"
                      onClick={() => playTrack(track, tracks)}
                      className="block"
                    >
                      <img
                        src={track.imageUrl}
                        alt={track.title}
                        className="
                            h-12
                            w-12
                            rounded
                            object-cover
                          "
                      />
                    </button>

                    {/*
                      |--------------------------------------------------------------------------
                      | Track info
                      |--------------------------------------------------------------------------
                      */}

                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => playTrack(track, tracks)}
                        className={`
                            block
                            max-w-full
                            truncate
                            text-left
                            font-semibold
                            hover:underline
                            ${isCurrent ? "text-[#1ed760]" : "text-white"}
                          `}
                      >
                        {track.title}
                      </button>

                      <p className="mt-1 truncate text-sm text-neutral-400">
                        {track.albumName || track.artistName}
                      </p>
                    </div>

                    {/*
                      |--------------------------------------------------------------------------
                      | Right controls
                      |--------------------------------------------------------------------------
                      */}

                    <div
                      className="
                          flex
                          items-center
                          gap-3
                        "
                    >
                      <div
                        className="
                            opacity-0
                            transition
                            group-hover:opacity-100
                          "
                      >
                        <AddToPlaylistButton track={track} />
                      </div>

                      <div
                        className="
                            opacity-0
                            transition
                            group-hover:opacity-100
                          "
                      >
                        <LikeButton track={track} />
                      </div>

                      <span
                        className="
                            min-w-11
                            text-right
                            text-sm
                            text-neutral-400
                          "
                      >
                        {formatDuration(track.durationSeconds)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
