import { create } from "zustand";

export const usePlayerStore = create((set, get) => ({
  currentTrack: null,

  queue: [],

  currentIndex: -1,

  isPlaying: false,

  volume: 0.8,

  playTrack: (track, queue = []) => {
    const playerQueue = queue.length > 0 ? queue : [track];

    const index = playerQueue.findIndex((item) => item.id === track.id);

    set({
      currentTrack: track,

      queue: playerQueue,

      currentIndex: index >= 0 ? index : 0,

      isPlaying: true,
    });
  },

  togglePlay: () => {
    const currentTrack = get().currentTrack;

    if (!currentTrack) {
      return;
    }

    set((state) => ({
      isPlaying: !state.isPlaying,
    }));
  },

  playNext: () => {
    const { queue, currentIndex } = get();

    const nextIndex = currentIndex + 1;

    if (nextIndex >= queue.length) {
      set({
        isPlaying: false,
      });

      return;
    }

    set({
      currentTrack: queue[nextIndex],

      currentIndex: nextIndex,

      isPlaying: true,
    });
  },

  playPrevious: () => {
    const { queue, currentIndex } = get();

    const previousIndex = currentIndex - 1;

    if (previousIndex < 0) {
      return;
    }

    set({
      currentTrack: queue[previousIndex],

      currentIndex: previousIndex,

      isPlaying: true,
    });
  },

  setIsPlaying: (isPlaying) => {
    set({
      isPlaying,
    });
  },

  setVolume: (volume) => {
    const safeVolume = Math.min(Math.max(volume, 0), 1);

    set({
      volume: safeVolume,
    });
  },

  clearPlayer: () => {
    set({
      currentTrack: null,
      queue: [],
      currentIndex: -1,
      isPlaying: false,
    });
  },
}));
