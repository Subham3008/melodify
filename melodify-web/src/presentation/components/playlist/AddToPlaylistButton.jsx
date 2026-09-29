"use client";

import { useEffect, useRef, useState } from "react";

import Link from "next/link";

import { usePlaylistStore } from "@/presentation/stores/playlist.store";

export default function AddToPlaylistButton({ track }) {
  const dropdownRef = useRef(null);

  const [message, setMessage] = useState("");

  const playlists = usePlaylistStore((state) => state.playlists);

  const initialized = usePlaylistStore((state) => state.initialized);

  const loading = usePlaylistStore((state) => state.loading);

  const fetchPlaylists = usePlaylistStore((state) => state.fetchPlaylists);

  const addTrack = usePlaylistStore((state) => state.addTrack);

  /*
  |--------------------------------------------------------------------------
  | Global dropdown state
  |--------------------------------------------------------------------------
  */

  const openPlaylistTrackId = usePlaylistStore(
    (state) => state.openPlaylistTrackId,
  );

  const togglePlaylistMenu = usePlaylistStore(
    (state) => state.togglePlaylistMenu,
  );

  const closePlaylistMenu = usePlaylistStore(
    (state) => state.closePlaylistMenu,
  );

  /*
  |--------------------------------------------------------------------------
  | Is THIS track dropdown open?
  |--------------------------------------------------------------------------
  */

  const isOpen = openPlaylistTrackId === track.id;

  /*
  |--------------------------------------------------------------------------
  | Open / close
  |--------------------------------------------------------------------------
  */

  const handleOpen = async (event) => {
    event.stopPropagation();

    const willOpen = !isOpen;

    setMessage("");

    /*
      | This automatically closes
      | any other track dropdown.
      */

    togglePlaylistMenu(track.id);

    /*
      | Only fetch playlists when
      | opening the menu.
      */

    if (willOpen && !initialized) {
      await fetchPlaylists();
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Outside click
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        closePlaylistMenu();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen, closePlaylistMenu]);

  /*
  |--------------------------------------------------------------------------
  | Escape key
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        closePlaylistMenu();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, closePlaylistMenu]);

  /*
  |--------------------------------------------------------------------------
  | Add track
  |--------------------------------------------------------------------------
  */

  const handleAdd = async (event, playlistId) => {
    event.stopPropagation();

    const added = await addTrack(playlistId, track);

    setMessage(added ? "Added ✓" : "Already added");
  };

  return (
    <div
      ref={dropdownRef}
      className="
        relative
      "
      onClick={(event) => event.stopPropagation()}
    >
      {/* + BUTTON */}

      <button
        type="button"
        onClick={handleOpen}
        className="
          flex
          h-9
          w-9
          items-center
          justify-center
          rounded-full
          bg-black/70
          text-xl
          text-white
          transition
          hover:scale-110
          hover:bg-black
        "
        aria-label={`Add ${track.title} to playlist`}
        aria-expanded={isOpen}
      >
        +
      </button>

      {/* DROPDOWN */}

      {isOpen && (
        <div
          className="
            absolute
            top-11
            left-1/2
            -translate-x-1/2
            z-100
            w-44
            overflow-hidden
            rounded-lg
            border
            border-neutral-700
            bg-[#282828]
            p-2
            shadow-2xl
          "
        >
          <p
            className="
              px-3
              py-2
              text-xs
              font-bold
              text-neutral-400
            "
          >
            ADD TO PLAYLIST
          </p>

          {/* LOADING */}

          {loading ? (
            <p
              className="
                px-3
                py-2
                text-sm
                text-neutral-400
              "
            >
              Loading...
            </p>
          ) : playlists.length === 0 ? (
            /*
            |--------------------------------------------------------------------------
            | No playlists
            |--------------------------------------------------------------------------
            */

            <div
              className="
                px-3
                py-2
              "
            >
              <p
                className="
                  text-sm
                  text-neutral-400
                "
              >
                No playlists yet.
              </p>

              <Link
                href="/playlists"
                onClick={() => closePlaylistMenu()}
                className="
                  mt-2
                  inline-block
                  text-sm
                  font-semibold
                  text-[#1ed760]
                "
              >
                Create one
              </Link>
            </div>
          ) : (
            /*
            |--------------------------------------------------------------------------
            | Playlist options
            |--------------------------------------------------------------------------
            */

            playlists.map((playlist) => (
              <button
                key={playlist.id}
                type="button"
                onClick={(event) => handleAdd(event, playlist.id)}
                className="
                    block
                    w-full
                    rounded-md
                    px-3
                    py-2.5
                    text-left
                    text-sm
                    text-white
                    transition
                    hover:bg-neutral-700
                  "
              >
                {playlist.name}
              </button>
            ))
          )}

          {/* RESULT */}

          {message && (
            <p
              className="
                px-3
                py-2
                text-xs
                font-semibold
                text-[#1ed760]
              "
            >
              {message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
