"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { usePlaylistStore } from "@/presentation/stores/playlist.store";
import { useAuthStore } from "@/presentation/stores/auth.store";

export default function LibrarySidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const menuRef = useRef(null);

  const [openMenuId, setOpenMenuId] = useState(null);

  const [renamePlaylistId, setRenamePlaylistId] = useState(null);

  const [renameValue, setRenameValue] = useState("");

  const [renaming, setRenaming] = useState(false);

  const user = useAuthStore((state) => state.user);

  const playlists = usePlaylistStore((state) => state.playlists);

  const initialized = usePlaylistStore((state) => state.initialized);

  const loading = usePlaylistStore((state) => state.loading);

  const fetchPlaylists = usePlaylistStore((state) => state.fetchPlaylists);

  const deletePlaylist = usePlaylistStore((state) => state.deletePlaylist);

  const renamePlaylist = usePlaylistStore((state) => state.renamePlaylist);

  /*
  |--------------------------------------------------------------------------
  | Load playlists
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (user && !initialized) {
      fetchPlaylists();
    }
  }, [user, initialized, fetchPlaylists]);

  const isActive = (path) => pathname === path;

  /*
  |--------------------------------------------------------------------------
  | Close playlist menu on outside click
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Open rename modal
  |--------------------------------------------------------------------------
  */

  const handleRenameOpen = (event, playlist) => {
    event.preventDefault();
    event.stopPropagation();

    setOpenMenuId(null);

    setRenamePlaylistId(playlist.id);

    setRenameValue(playlist.name);
  };

  /*
  |--------------------------------------------------------------------------
  | Rename playlist
  |--------------------------------------------------------------------------
  */

  const handleRenameSubmit = async (event) => {
    event.preventDefault();

    if (!renamePlaylistId || !renameValue.trim()) {
      return;
    }

    setRenaming(true);

    try {
      await renamePlaylist(renamePlaylistId, renameValue.trim());

      setRenamePlaylistId(null);
      setRenameValue("");
    } finally {
      setRenaming(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Delete playlist
  |--------------------------------------------------------------------------
  */

  const handleDelete = async (event, playlist) => {
    event.preventDefault();
    event.stopPropagation();

    setOpenMenuId(null);

    const confirmed = window.confirm(`Delete "${playlist.name}"?`);

    if (!confirmed) {
      return;
    }

    await deletePlaylist(playlist.id);

    /*
    |--------------------------------------------------------------------------
    | If currently viewing deleted playlist
    |--------------------------------------------------------------------------
    */

    if (pathname === `/playlists/${playlist.id}`) {
      router.replace("/playlists");
    }
  };

  return (
    <>
      <aside
        className="
          flex
          h-full
          flex-col
          overflow-hidden
          rounded-xl
          bg-[#121212]
        "
      >
        {/* LOGO */}

        <div
          className="
            flex
            h-20
            shrink-0
            items-center
            border-b
            border-neutral-800
            px-5
          "
        >
          <Link
            href="/"
            className="
              text-2xl
              font-black
              text-white
            "
          >
            Melodify
          </Link>
        </div>

        {/* MAIN LINKS */}

        <div className="p-3">
          <Link
            href="/"
            className={`
              mb-1
              flex
              items-center
              gap-3
              rounded-lg
              px-3
              py-3
              text-sm
              font-semibold
              transition

              ${
                isActive("/")
                  ? "bg-[#282828] text-white"
                  : "text-neutral-400 hover:bg-[#1f1f1f] hover:text-white"
              }
            `}
          >
            <span className="text-lg">⌂</span>
            Home
          </Link>

          <Link
            href="/liked"
            className={`
              mb-1
              flex
              items-center
              gap-3
              rounded-lg
              px-3
              py-3
              text-sm
              font-semibold
              transition

              ${
                isActive("/liked")
                  ? "bg-[#282828] text-white"
                  : "text-neutral-400 hover:bg-[#1f1f1f] hover:text-white"
              }
            `}
          >
            <span className="text-lg">♥</span>
            Liked Songs
          </Link>
        </div>

        {/* LIBRARY HEADER */}

        <div
          className="
            flex
            items-center
            justify-between
            px-5
            pt-3
            pb-3
          "
        >
          <Link
            href="/playlists"
            className="
              font-bold
              text-neutral-300
              transition
              hover:text-white
            "
          >
            Your Library
          </Link>

          <Link
            href="/playlists"
            title="Create playlist"
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-full
              text-xl
              text-neutral-300
              transition
              hover:bg-[#282828]
              hover:text-white
            "
          >
            +
          </Link>
        </div>

        {/* PLAYLIST LIST */}

        <div
          className="
            flex-1
            overflow-y-auto
            px-2
            pb-4
          "
        >
          {loading && playlists.length === 0 ? (
            <p
              className="
                px-3
                py-4
                text-sm
                text-neutral-500
              "
            >
              Loading...
            </p>
          ) : playlists.length === 0 ? (
            <div
              className="
                mx-2
                rounded-lg
                bg-[#242424]
                p-4
              "
            >
              <p
                className="
                  text-sm
                  font-bold
                "
              >
                Create your first playlist
              </p>

              <p
                className="
                  mt-1
                  text-xs
                  text-neutral-400
                "
              >
                Save your favourite tracks together.
              </p>

              <Link
                href="/playlists"
                className="
                  mt-4
                  inline-block
                  rounded-full
                  bg-white
                  px-4
                  py-2
                  text-xs
                  font-bold
                  text-black
                "
              >
                Create playlist
              </Link>
            </div>
          ) : (
            playlists.map((playlist) => {
              const href = `/playlists/${playlist.id}`;

              const active = pathname === href;

              const menuOpen = openMenuId === playlist.id;

              return (
                <div
                  key={playlist.id}
                  className="
                      group
                      relative
                    "
                >
                  {/* PLAYLIST LINK */}

                  <Link
                    href={href}
                    className={`
                        flex
                        items-center
                        gap-3
                        rounded-lg
                        px-3
                        py-2
                        pr-10
                        transition

                        ${active ? "bg-[#282828]" : "hover:bg-[#1f1f1f]"}
                      `}
                  >
                    {/* PLAYLIST THUMBNAIL */}

                    <div
                      className="
                          flex
                          h-12
                          w-12
                          shrink-0
                          items-center
                          justify-center
                          rounded
                          bg-linear-to-br
                          from-neutral-700
                          to-neutral-900
                          text-xl
                        "
                    >
                      ♪
                    </div>

                    {/* PLAYLIST INFO */}

                    <div className="min-w-0">
                      <p
                        className={`
                            truncate
                            text-sm
                            font-semibold

                            ${active ? "text-[#1ed760]" : "text-white"}
                          `}
                      >
                        {playlist.name}
                      </p>

                      <p
                        className="
                            mt-0.5
                            truncate
                            text-xs
                            text-neutral-500
                          "
                      >
                        Playlist • {playlist.trackCount} songs
                      </p>
                    </div>
                  </Link>

                  {/* THREE DOT BUTTON */}

                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();

                      setOpenMenuId(menuOpen ? null : playlist.id);
                    }}
                    className={`
                        absolute
                        top-1/2
                        right-2
                        flex
                        h-8
                        w-8
                        -translate-y-1/2
                        items-center
                        justify-center
                        rounded-full
                        text-lg
                        text-neutral-400
                        transition
                        hover:bg-[#333333]
                        hover:text-white

                        ${
                          menuOpen
                            ? "opacity-100"
                            : "opacity-0 group-hover:opacity-100"
                        }
                      `}
                    aria-label={`More options for ${playlist.name}`}
                  >
                    ⋮
                  </button>

                  {/* PLAYLIST OPTIONS MENU */}

                  {menuOpen && (
                    <div
                      ref={menuRef}
                      className="
                          absolute
                          top-12
                          right-2
                          z-100
                          w-40
                          overflow-hidden
                          rounded-lg
                          border
                          border-neutral-700
                          bg-[#282828]
                          p-1
                          shadow-2xl
                        "
                    >
                      {/* RENAME */}

                      <button
                        type="button"
                        onClick={(event) => handleRenameOpen(event, playlist)}
                        className="
                            block
                            w-full
                            rounded-md
                            px-3
                            py-2.5
                            text-left
                            text-sm
                            text-white
                            hover:bg-[#3e3e3e]
                          "
                      >
                        Rename
                      </button>

                      {/* DELETE */}

                      <button
                        type="button"
                        onClick={(event) => handleDelete(event, playlist)}
                        className="
                            block
                            w-full
                            rounded-md
                            px-3
                            py-2.5
                            text-left
                            text-sm
                            text-red-400
                            hover:bg-[#3e3e3e]
                            hover:text-red-300
                          "
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* RENAME PLAYLIST MODAL */}

      {renamePlaylistId && (
        <div
          className="
            fixed
            inset-0
            z-200
            flex
            items-center
            justify-center
            bg-black/70
            px-4
          "
          onMouseDown={() => {
            setRenamePlaylistId(null);

            setRenameValue("");
          }}
        >
          <form
            onSubmit={handleRenameSubmit}
            onMouseDown={(event) => event.stopPropagation()}
            className="
              w-full
              max-w-md
              rounded-xl
              border
              border-neutral-700
              bg-[#282828]
              p-6
              shadow-2xl
            "
          >
            <h2
              className="
                text-xl
                font-bold
                text-white
              "
            >
              Rename playlist
            </h2>

            <input
              autoFocus
              type="text"
              value={renameValue}
              onChange={(event) => setRenameValue(event.target.value)}
              maxLength={80}
              className="
                mt-5
                w-full
                rounded-lg
                border
                border-neutral-600
                bg-[#181818]
                px-4
                py-3
                text-white
                outline-none
                focus:border-white
              "
            />

            <div
              className="
                mt-6
                flex
                justify-end
                gap-3
              "
            >
              <button
                type="button"
                onClick={() => {
                  setRenamePlaylistId(null);

                  setRenameValue("");
                }}
                className="
                  rounded-full
                  px-5
                  py-2.5
                  text-sm
                  font-semibold
                  text-neutral-300
                  hover:text-white
                "
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={renaming || !renameValue.trim()}
                className="
                  rounded-full
                  bg-white
                  px-5
                  py-2.5
                  text-sm
                  font-bold
                  text-black
                  transition
                  hover:scale-105
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                {renaming ? "Renaming..." : "Rename"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
