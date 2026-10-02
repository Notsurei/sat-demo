import { create } from "zustand";

export type FullTestTimerPhase =
  | "IDLE"
  | "RW_M1"
  | "RW_M2"
  | "BREAK"
  | "MATH_M1"
  | "MATH_M2"
  | "FINISHED";

export const FULL_TEST_TIME = {
  RW_MODULE: 32 * 60,
  BREAK: 10 * 60,
  MATH_MODULE: 35 * 60,
} as const;

interface FullTestTimerStore {
  phase: FullTestTimerPhase;

  remainingTime: number;
  initialTime: number;

  isRunning: boolean;
  isPaused: boolean;

  startRwM1: () => void;
  startRwM2: () => void;

  startBreak: () => void;

  startMathM1: () => void;
  startMathM2: () => void;

  pause: () => void;
  resume: () => void;

  tick: () => void;

  finish: () => void;
  reset: () => void;

  setRemainingTime: (seconds: number) => void;

  getProgress: () => number;
}

const initialState = {
  phase: "IDLE" as FullTestTimerPhase,
  remainingTime: 0,
  initialTime: 0,
  isRunning: false,
  isPaused: false,
};

function createPhaseState(phase: FullTestTimerPhase, seconds: number) {
  return {
    phase,
    remainingTime: seconds,
    initialTime: seconds,
    isRunning: true,
    isPaused: false,
  };
}

export const useFullTestTimerStore = create<FullTestTimerStore>((set, get) => ({
  ...initialState,

  startRwM1: () => {
    set(createPhaseState("RW_M1", FULL_TEST_TIME.RW_MODULE));
  },

  startRwM2: () => {
    set(createPhaseState("RW_M2", FULL_TEST_TIME.RW_MODULE));
  },

  startBreak: () => {
    set(createPhaseState("BREAK", FULL_TEST_TIME.BREAK));
  },

  startMathM1: () => {
    set(createPhaseState("MATH_M1", FULL_TEST_TIME.MATH_MODULE));
  },

  startMathM2: () => {
    set(createPhaseState("MATH_M2", FULL_TEST_TIME.MATH_MODULE));
  },

  pause: () => {
    set({
      isRunning: false,
      isPaused: true,
    });
  },

  resume: () => {
    const { phase, remainingTime } = get();

    if (phase === "IDLE" || phase === "FINISHED" || remainingTime <= 0) {
      return;
    }

    set({
      isRunning: true,
      isPaused: false,
    });
  },

  tick: () => {
    const { isRunning, remainingTime } = get();

    if (!isRunning) {
      return;
    }

    if (remainingTime <= 1) {
      set({
        remainingTime: 0,
        isRunning: false,
        isPaused: false,
      });

      return;
    }

    set({
      remainingTime: remainingTime - 1,
    });
  },

  setRemainingTime: (seconds) => {
    set({
      remainingTime: Math.max(0, seconds),
    });
  },

  finish: () => {
    set({
      phase: "FINISHED",
      remainingTime: 0,
      initialTime: 0,
      isRunning: false,
      isPaused: false,
    });
  },

  reset: () => {
    set({
      ...initialState,
    });
  },

  getProgress: () => {
    const { remainingTime, initialTime } = get();

    if (initialTime <= 0) {
      return 0;
    }

    return Math.min(
      100,
      Math.max(0, ((initialTime - remainingTime) / initialTime) * 100),
    );
  },
}));
