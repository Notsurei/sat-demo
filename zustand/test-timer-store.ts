import { create } from "zustand";

export interface BaseTimerStore<TPhase extends string> {
  phase: TPhase;
  remainingTime: number;
  initialTime: number;
  isRunning: boolean;
  isPaused: boolean;

  startPhase: (phase: TPhase, seconds: number) => void;

  pause: () => void;
  resume: () => void;
  tick: () => void;
  finish: () => void;
  reset: () => void;
  setRemainingTime: (seconds: number) => void;
  getProgress: () => number;
}

export function createTimerStore<TPhase extends string>(
  initialPhase: TPhase,
  idlePhase: TPhase,
) {
  const initialState = {
    phase: idlePhase,
    remainingTime: 0,
    initialTime: 0,
    isRunning: false,
    isPaused: false,
  };

  return create<BaseTimerStore<TPhase>>((set, get) => ({
    ...initialState,

    startPhase: (phase, seconds) => {
      set({
        phase,
        remainingTime: seconds,
        initialTime: seconds,
        isRunning: true,
        isPaused: false,
      });
    },

    pause: () => set({ isRunning: false, isPaused: true }),

    resume: () => {
      const { phase, remainingTime } = get();
      if (
        phase === idlePhase ||
        phase === ("FINISHED" as TPhase) ||
        remainingTime <= 0
      ) {
        return;
      }
      set({ isRunning: true, isPaused: false });
    },

    tick: () => {
      const { isRunning, remainingTime } = get();
      if (!isRunning) return;
      if (remainingTime <= 1) {
        set({ remainingTime: 0, isRunning: false, isPaused: false });
        return;
      }
      set({ remainingTime: remainingTime - 1 });
    },

    setRemainingTime: (seconds) =>
      set({ remainingTime: Math.max(0, seconds) }),

    finish: () => {
      set({
        phase: "FINISHED" as TPhase,
        remainingTime: 0,
        initialTime: 0,
        isRunning: false,
        isPaused: false,
      });
    },

    reset: () => set({ ...initialState }),

    getProgress: () => {
      const { remainingTime, initialTime } = get();
      if (initialTime <= 0) return 0;
      return Math.min(
        100,
        Math.max(0, ((initialTime - remainingTime) / initialTime) * 100),
      );
    },
  }));
}