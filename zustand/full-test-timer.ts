import { createTimerStore } from "./test-timer-store";

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

export const useFullTestTimerStore = createTimerStore<FullTestTimerPhase>(
  "IDLE",
  "IDLE",
);

const store = () => useFullTestTimerStore.getState();

export const fullTestTimer = {
  startRwM1: () => store().startPhase("RW_M1", FULL_TEST_TIME.RW_MODULE),
  startRwM2: () => store().startPhase("RW_M2", FULL_TEST_TIME.RW_MODULE),
  startBreak: () => store().startPhase("BREAK", FULL_TEST_TIME.BREAK),
  startMathM1: () => store().startPhase("MATH_M1", FULL_TEST_TIME.MATH_MODULE),
  startMathM2: () => store().startPhase("MATH_M2", FULL_TEST_TIME.MATH_MODULE),
};