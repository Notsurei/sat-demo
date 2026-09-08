"use client";

import { create } from "zustand";

export type FullTestTimerPhase =
  | "IDLE"
  | "READING_WRITING"
  | "BREAK"
  | "MATH"
  | "FINISHED";

interface FullTestTimerStore {
  phase: FullTestTimerPhase;
  remainingTime: number;
  initialTime: number;
  isRunning: boolean;
  isPaused: boolean;
  startReadingWriting: () => void;
  startBreak: () => void;
  startMath: () => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  tick: () => void;
  reset: () => void;
  finish: () => void;
  setRemainingTime: (
    seconds: number,
  ) => void;

  getProgress: () => number;
}

export const FULL_TEST_TIME = {
  READING_WRITING: 32 * 60,

  BREAK: 10 * 60,

  MATH: 32 * 60,
} as const;

const initialState = {
  phase: "IDLE" as FullTestTimerPhase,

  remainingTime: 0,

  initialTime: 0,

  isRunning: false,

  isPaused: false,
};

export const useFullTestTimerStore =
  create<FullTestTimerStore>((set, get) => ({
    ...initialState,

    startReadingWriting: () => {
      set({
        phase: "READING_WRITING",

        remainingTime:
          FULL_TEST_TIME.READING_WRITING,

        initialTime:
          FULL_TEST_TIME.READING_WRITING,

        isRunning: true,

        isPaused: false,
      });
    },

    startBreak: () => {
      set({
        phase: "BREAK",

        remainingTime:
          FULL_TEST_TIME.BREAK,

        initialTime:
          FULL_TEST_TIME.BREAK,

        isRunning: true,

        isPaused: false,
      });
    },

    startMath: () => {
      set({
        phase: "MATH",

        remainingTime:
          FULL_TEST_TIME.MATH,

        initialTime:
          FULL_TEST_TIME.MATH,

        isRunning: true,

        isPaused: false,
      });
    },

    start: () => {
      set({
        isRunning: true,

        isPaused: false,
      });
    },

    pause: () => {
      set({
        isRunning: false,

        isPaused: true,
      });
    },

    resume: () => {
      const {
        remainingTime,
        phase,
      } = get();

      if (
        remainingTime <= 0 ||
        phase === "FINISHED" ||
        phase === "IDLE"
      ) {
        return;
      }

      set({
        isRunning: true,

        isPaused: false,
      });
    },

    tick: () => {
      const {
        isRunning,
        remainingTime,
      } = get();

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
        remainingTime:
          remainingTime - 1,
      });
    },

    setRemainingTime: (
      seconds,
    ) => {
      set({
        remainingTime:
          Math.max(0, seconds),
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

    // ==========================================
    // RESET
    // ==========================================

    reset: () => {
      set({
        ...initialState,
      });
    },

    getProgress: () => {
      const {
        remainingTime,
        initialTime,
      } = get();

      if (initialTime <= 0) {
        return 0;
      }

      return Math.min(
        100,
        Math.max(
          0,
          ((initialTime -
            remainingTime) /
            initialTime) *
            100,
        ),
      );
    },
  }));