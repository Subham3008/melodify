"use client";

import { use, useEffect } from "react";

import Link from "next/link";

import { useAlbumStore } from "@/presentation/stores/album.store";

import { usePlayerStore } from "@/presentation/stores/player.store";

import LikeButton from "@/presentation/components/like/LikeButton";

import AddToPlaylistButton from "@/presentation/components/playlist/AddToPlaylistButton";

/*
|--------------------------------------------------------------------------
| Duration
|--------------------------------------------------------------------------
*/

const formatDuration = (durationSeconds) => {
  const totalSeconds = Math.max(Math.floor(Number(durationSeconds) || 0), 0);

  const minutes = Math.floor(totalSeconds / 60);

  const seconds = String(totalSeconds % 60).padStart(2, "0");

  return `${minutes}:${seconds}`;
};

export default function AlbumPage({ params }) {
  const { albumId } = use(params);

  /*
  |--------------------------------------------------------------------------
  | Album store
  |--------------------------------------------------------------------------
  */

  const album = useAlbumStore((state) => state.album);

  const tracks = useAlbumStore((state) => state.tracks);

  const loading = useAlbumStore((state) => state.loading);

  const error = useAlbumStore((state) => state.error);

  const fetchAlbum = useAlbumStore((state) => state.fetchAlbum);

  const clearAlbum = useAlbumStore((state) => state.clearAlbum);

  /*
  |--------------------------------------------------------------------------
  | Player
  |--------------------------------------------------------------------------
  */

  const playTrack = usePlayerStore((state) => state.playTrack);

  const currentTrack = usePlayerStore((state) => state.currentTrack);

  const isPlaying = usePlayerStore((state) => state.isPlaying);

  const togglePlay = usePlayerStore((state) => state.togglePlay);

  /*
  |--------------------------------------------------------------------------
  | Fetch album
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!albumId) {
      return;
    }

    void fetchAlbum(albumId);

    return () => {
      clearAlbum();
    };
  }, [albumId, fetchAlbum, clearAlbum]);

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="min-h-full bg-[#121212] p-8 text-neutral-400">
        Loading album...
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Error
  |--------------------------------------------------------------------------
  */

  if (error || !album) {
    return (
      <div className="min-h-full bg-[#121212] p-8">
        <p className="text-red-400">{error || "Album not found"}</p>

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

  /*
  |--------------------------------------------------------------------------
  | Album playing?
  |--------------------------------------------------------------------------
  */

  const currentTrackBelongsToAlbum = tracks.some(
    (track) => track.id === currentTrack?.id,
  );

  const albumIsPlaying = currentTrackBelongsToAlbum && isPlaying;

  /*
  |--------------------------------------------------------------------------
  | Play album
  |--------------------------------------------------------------------------
  */

  const handlePlayAlbum = () => {
    if (tracks.length === 0) {
      return;
    }

    /*
      |--------------------------------------------------------------------------
      | Album already active
      |--------------------------------------------------------------------------
      */

    if (currentTrackBelongsToAlbum) {
      togglePlay();

      return;
    }

    /*
      |--------------------------------------------------------------------------
      | Start album from first track
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
        {album.imageUrl ? (
          <>
            <img
              src={album.imageUrl}
              alt=""
              aria-hidden="true"
              className="
                absolute
                inset-0
                h-full
                w-full
                scale-110
                object-cover
                opacity-35
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
              from-neutral-700
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
          {album.imageUrl ? (
            <img
              src={album.imageUrl}
              alt={album.albumName}
              className="
                h-48
                w-48
                shrink-0
                rounded-md
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
                rounded-md
                bg-neutral-800
                text-6xl
                shadow-2xl
                md:h-56
                md:w-56
              "
            >
              ♫
            </div>
          )}

          <div className="min-w-0 pb-2">
            <p className="text-sm font-bold">Album</p>

            <h1
              className="
                mt-2
                wrap-break-word
                text-4xl
                font-black
                tracking-tight
                md:text-6xl
                lg:text-7xl
              "
            >
              {album.albumName}
            </h1>

            <div
              className="
                mt-5
                flex
                flex-wrap
                items-center
                gap-1
                text-sm
              "
            >
              <Link
                href={`/artist/${album.artistId}`}
                className="
                  font-bold
                  hover:underline
                "
              >
                {album.artistName}
              </Link>

              <span className="text-neutral-400">•</span>

              <span className="text-neutral-300">
                {tracks.length} {tracks.length === 1 ? "song" : "songs"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/*
      |--------------------------------------------------------------------------
      | Content
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
        | Main play button
        |--------------------------------------------------------------------------
        */}

        <div className="mb-9">
          <button
            type="button"
            onClick={handlePlayAlbum}
            disabled={tracks.length === 0}
            className="
              flex
              h-14
              w-14
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
              albumIsPlaying
                ? `Pause ${album.albumName}`
                : `Play ${album.albumName}`
            }
          >
            {albumIsPlaying ? "Ⅱ" : "▶"}
          </button>
        </div>

        {/*
        |--------------------------------------------------------------------------
        | Table heading
        |--------------------------------------------------------------------------
        */}

        <div
          className="
            grid
            grid-cols-[40px_minmax(0,1fr)_auto]
            items-center
            gap-4
            border-b
            border-white/10
            px-3
            pb-3
            text-sm
            text-neutral-400
          "
        >
          <span className="text-center">#</span>

          <span>Title</span>

          <span className="pr-3">Time</span>
        </div>

        {/*
        |--------------------------------------------------------------------------
        | Tracks
        |--------------------------------------------------------------------------
        */}

        <div className="mt-2">
          {tracks.map((track, index) => {
            const isCurrent = currentTrack?.id === track.id;

            return (
              <div
                key={track.id}
                className={`
                    group
                    grid
                    grid-cols-[40px_minmax(0,1fr)_auto]
                    items-center
                    gap-4
                    rounded-md
                    px-3
                    py-2

                    ${isCurrent ? "bg-white/5" : "hover:bg-white/10"}
                  `}
              >
                {/*
                  |--------------------------------------------------------------------------
                  | Number / Play
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
                >
                  {isCurrent && isPlaying ? (
                    <span className="text-[#1ed760]">♪</span>
                  ) : (
                    <>
                      <span className="group-hover:hidden">{index + 1}</span>

                      <span className="hidden text-white group-hover:inline">
                        ▶
                      </span>
                    </>
                  )}
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

                  <Link
                    href={`/artist/${track.artistId}`}
                    className="
                        mt-1
                        block
                        w-fit
                        max-w-full
                        truncate
                        text-sm
                        text-neutral-400
                        hover:text-white
                        hover:underline
                      "
                  >
                    {track.artistName}
                  </Link>
                </div>

                {/*
                  |--------------------------------------------------------------------------
                  | Actions
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
      </section>
    </div>
  );
}
