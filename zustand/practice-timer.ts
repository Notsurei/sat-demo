import { create } from "zustand";

let timer: ReturnType<typeof setInterval> | null = null;

interface PracticeTimerState {
  seconds: number;
  isRunning: boolean;

  start: () => void;
  pause: () => void;
  reset: () => void;

  setSeconds: (seconds: number) => void;
}

export const usePracticeTimerStore = create<PracticeTimerState>((set, get) => ({
  seconds: 0,
  isRunning: false,

  start: () => {
    if (get().isRunning) return;

    set({ isRunning: true });

    timer = setInterval(() => {
      set((state) => ({
        seconds: state.seconds + 1,
      }));
    }, 1000);
  },

  pause: () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }

    set({ isRunning: false });
  },

  reset: () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }

    set({
      seconds: 0,
      isRunning: false,
    });
  },

  setSeconds: (seconds) => set({ seconds }),
}));