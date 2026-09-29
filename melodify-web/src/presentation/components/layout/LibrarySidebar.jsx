"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { usePlaylistStore } from "@/presentation/stores/playlist.store";
import { useAuthStore } from "@/presentation/stores/auth.store";

export default function LibrarySidebar() {
  const pathname = usePathname();

  const user = useAuthStore((state) => state.user);

  const playlists = usePlaylistStore((state) => state.playlists);

  const initialized = usePlaylistStore((state) => state.initialized);

  const loading = usePlaylistStore((state) => state.loading);

  const fetchPlaylists = usePlaylistStore((state) => state.fetchPlaylists);

  useEffect(() => {
    if (user && !initialized) {
      fetchPlaylists();
    }
  }, [user, initialized, fetchPlaylists]);

  const isActive = (path) => pathname === path;

  return (
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

            return (
              <Link
                key={playlist.id}
                href={href}
                className={`
                    flex
                    items-center
                    gap-3
                    rounded-lg
                    px-3
                    py-2
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
            );
          })
        )}
      </div>
    </aside>
  );
}
