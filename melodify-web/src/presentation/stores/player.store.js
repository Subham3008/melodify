import { create } from "zustand";

export const usePlayerStore = create((set, get) => ({
  currentTrack: null,

  queue: [],

  currentIndex: -1,

  isPlaying: false,

  volume: 0.8,

  /*
  |--------------------------------------------------------------------------
  | Play track
  |--------------------------------------------------------------------------
  */

  playTrack: (track, queue = []) => {
    if (!track) {
      return;
    }

    const playerQueue =
      queue.length > 0
        ? queue
        : [track];

    const index =
      playerQueue.findIndex(
        (item) =>
          item.id === track.id,
      );

    set({
      currentTrack: track,

      queue:
        playerQueue,

      currentIndex:
        index >= 0
          ? index
          : 0,

      isPlaying: true,
    });
  },

  /*
  |--------------------------------------------------------------------------
  | Play particular queue item
  |--------------------------------------------------------------------------
  |
  | Right sidebar "Up Next" se kisi particular song par click hoga.
  |
  | IMPORTANT:
  |
  | Queue replace nahi hogi.
  | Sirf currentIndex + currentTrack change hoga.
  |
  */

  playQueueTrack: (
    index,
  ) => {
    const {
      queue,
    } = get();

    if (
      !Number.isInteger(
        index,
      ) ||
      index < 0 ||
      index >=
      queue.length
    ) {
      return;
    }

    const track =
      queue[index];

    if (!track) {
      return;
    }

    set({
      currentTrack:
        track,

      currentIndex:
        index,

      isPlaying:
        true,
    });
  },

  /*
  |--------------------------------------------------------------------------
  | Toggle play
  |--------------------------------------------------------------------------
  */

  togglePlay: () => {
    const currentTrack =
      get().currentTrack;

    if (!currentTrack) {
      return;
    }

    set((state) => ({
      isPlaying:
        !state.isPlaying,
    }));
  },

  /*
  |--------------------------------------------------------------------------
  | Next
  |--------------------------------------------------------------------------
  */

  playNext: () => {
    const {
      queue,
      currentIndex,
    } = get();

    const nextIndex =
      currentIndex + 1;

    if (
      nextIndex >=
      queue.length
    ) {
      set({
        isPlaying:
          false,
      });

      return;
    }

    set({
      currentTrack:
        queue[nextIndex],

      currentIndex:
        nextIndex,

      isPlaying:
        true,
    });
  },

  /*
  |--------------------------------------------------------------------------
  | Previous
  |--------------------------------------------------------------------------
  */

  playPrevious: () => {
    const {
      queue,
      currentIndex,
    } = get();

    const previousIndex =
      currentIndex - 1;

    if (
      previousIndex < 0
    ) {
      return;
    }

    set({
      currentTrack:
        queue[
        previousIndex
        ],

      currentIndex:
        previousIndex,

      isPlaying:
        true,
    });
  },

  /*
  |--------------------------------------------------------------------------
  | Explicit playing state
  |--------------------------------------------------------------------------
  */

  setIsPlaying: (
    isPlaying,
  ) => {
    set({
      isPlaying,
    });
  },

  /*
  |--------------------------------------------------------------------------
  | Volume
  |--------------------------------------------------------------------------
  */

  setVolume: (
    volume,
  ) => {
    const safeVolume =
      Math.min(
        Math.max(
          volume,
          0,
        ),
        1,
      );

    set({
      volume:
        safeVolume,
    });
  },

  /*
  |--------------------------------------------------------------------------
  | Clear player
  |--------------------------------------------------------------------------
  */

  clearPlayer: () => {
    set({
      currentTrack:
        null,

      queue: [],

      currentIndex:
        -1,

      isPlaying:
        false,
    });
  },
}));