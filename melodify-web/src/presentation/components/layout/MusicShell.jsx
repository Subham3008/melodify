"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/presentation/stores/auth.store";
import LibrarySidebar from "./LibrarySidebar";
import NowPlayingSidebar from "./NowPlayingSidebar";
import MusicTopBar from "./MusicTopBar";

const DEFAULT_LIBRARY_WIDTH = 280;
const MIN_LIBRARY_WIDTH = 220;
const MAX_LIBRARY_WIDTH = 420;

const DEFAULT_NOW_PLAYING_WIDTH = 330;
const MIN_NOW_PLAYING_WIDTH = 280;
const MAX_NOW_PLAYING_WIDTH = 480;

export default function MusicShell({ children }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const authLoading = useAuthStore((state) => state.loading);

  const [libraryWidth, setLibraryWidth] = useState(DEFAULT_LIBRARY_WIDTH);
  const [resizing, setResizing] = useState(false);

  const [nowPlayingWidth, setNowPlayingWidth] = useState(
    DEFAULT_NOW_PLAYING_WIDTH,
  );

  const [resizingNowPlaying, setResizingNowPlaying] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Restore sidebar width
  |--------------------------------------------------------------------------
  */

  /*left sidebar effect logic*/
  useEffect(() => {
    const savedWidth = window.localStorage.getItem("melodify-library-width");

    if (!savedWidth) {
      return;
    }

    const parsed = Number(savedWidth);

    if (Number.isFinite(parsed)) {
      setLibraryWidth(
        Math.min(
          MAX_LIBRARY_WIDTH,

          Math.max(MIN_LIBRARY_WIDTH, parsed),
        ),
      );
    }
  }, []);

  /*right sidebar effect logic*/
  useEffect(() => {
    const savedWidth = window.localStorage.getItem(
      "melodify-now-playing-width",
    );

    if (!savedWidth) {
      return;
    }

    const parsed = Number(savedWidth);

    if (Number.isFinite(parsed)) {
      setNowPlayingWidth(
        Math.min(
          MAX_NOW_PLAYING_WIDTH,

          Math.max(MIN_NOW_PLAYING_WIDTH, parsed),
        ),
      );
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Save width
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    window.localStorage.setItem(
      "melodify-library-width",

      String(libraryWidth),
    );
  }, [libraryWidth]);

  useEffect(() => {
    window.localStorage.setItem(
      "melodify-now-playing-width",

      String(nowPlayingWidth),
    );
  }, [nowPlayingWidth]);

  /*
  |--------------------------------------------------------------------------
  | Resize mouse movement
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!resizing) {
      return;
    }

    const handlePointerMove = (event) => {
      /*
        | 8px = outer shell padding
        */

      const width = event.clientX - 8;

      setLibraryWidth(
        Math.min(
          MAX_LIBRARY_WIDTH,

          Math.max(MIN_LIBRARY_WIDTH, width),
        ),
      );
    };

    const stopResizing = () => {
      setResizing(false);
    };

    window.addEventListener("pointermove", handlePointerMove);

    window.addEventListener("pointerup", stopResizing);

    document.body.style.cursor = "col-resize";

    document.body.style.userSelect = "none";

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);

      window.removeEventListener("pointerup", stopResizing);

      document.body.style.cursor = "";

      document.body.style.userSelect = "";
    };
  }, [resizing]);

  useEffect(() => {
    if (!resizingNowPlaying) {
      return;
    }

    const handlePointerMove = (event) => {
      /*
      |--------------------------------------------------------------------------
      | Calculate distance from mouse to right edge
      |--------------------------------------------------------------------------
      |
      | Mouse ko left kheenchoge
      | → sidebar wider
      |
      | Mouse ko right kheenchoge
      | → sidebar smaller
      |
      */

      const width = window.innerWidth - event.clientX - 8;

      setNowPlayingWidth(
        Math.min(
          MAX_NOW_PLAYING_WIDTH,

          Math.max(MIN_NOW_PLAYING_WIDTH, width),
        ),
      );
    };

    const stopResizing = () => {
      setResizingNowPlaying(false);
    };

    window.addEventListener("pointermove", handlePointerMove);

    window.addEventListener("pointerup", stopResizing);

    document.body.style.cursor = "col-resize";

    document.body.style.userSelect = "none";

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);

      window.removeEventListener("pointerup", stopResizing);

      document.body.style.cursor = "";

      document.body.style.userSelect = "";
    };
  }, [resizingNowPlaying]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  if (authLoading) {
    return (
      <div
        className="
        flex
        min-h-screen
        items-center
        justify-center
        bg-black
        text-white
      "
      >
        Loading...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div
      className="
        h-screen
        overflow-hidden
        bg-black
        text-white
      "
    >
      {/*
        GlobalPlayer roughly bottom 96px leta hai.

        Agar tumhara player exactly 80px hai,
        then 96px ko 80px kar dena.
      */}

      <div
        className="
          h-[calc(100vh-96px)]
          min-h-0
          overflow-hidden
          p-2
        "
      >
        <div
          style={{
            "--library-width": `${libraryWidth}px`,

            "--now-playing-width": `${nowPlayingWidth}px`,
          }}
          className="
            grid
            h-full
            min-h-0
            grid-cols-1
            gap-2

            md:grid-cols-[var(--library-width)_minmax(0, 1fr)]

            xl:grid-cols-[var(--library-width)_minmax(0,1fr)_var(--now-playing-width)]
          "
        >
          {/* LEFT SIDEBAR */}

          <div
            className="
              relative
              hidden
              min-w-0
              md:block
            "
          >
            <LibrarySidebar />

            {/* RESIZE HANDLE */}

            <div
              onPointerDown={() => setResizing(true)}
              title="Resize library"
              className={`
                absolute
                top-0
                -right-1
                z-50
                h-full
                w-2
                cursor-col-resize

                ${resizing ? "bg-white/20" : "bg-transparent hover:bg-white/10"}
              `}
            />
          </div>

          {/* CENTER */}

          <main
            className="
              music-main-scroll
              min-w-0
              overflow-y-auto
              rounded-xl
              bg-[#121212]
            "
          >
            <MusicTopBar />
            {children}
          </main>

          {/* RIGHT SIDEBAR */}

          <div
            className="
                relative
                hidden
                min-h-0
                min-w-0
                overflow-hidden
                xl:block
              "
          >
            {/* RIGHT SIDEBAR RESIZE HANDLE */}

            <div
              onPointerDown={() => setResizingNowPlaying(true)}
              title="Resize now playing panel"
              className={`
                  absolute
                  top-0
                  -left-1
                  z-50
                  h-full
                  w-2
                  cursor-col-resize

                  ${resizingNowPlaying ? "bg-white/20" : "bg-transparent hover:bg-white/10"}
                `}
            />

            <NowPlayingSidebar />
          </div>
        </div>
      </div>
    </div>
  );
}
