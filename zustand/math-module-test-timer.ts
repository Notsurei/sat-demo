import { createTimerStore } from "./test-timer-store";

export type MathTestTimerPhase =
  | "IDLE"
  | "MATH_M1"
  | "MATH_M2"
  | "FINISHED";

export const MATH_TEST_TIME = {
  MATH_MODULE: 35 * 60,
} as const;

export const useMathTestTimerStore = createTimerStore<MathTestTimerPhase>(
  "IDLE",
  "IDLE",
);

const store = () => useMathTestTimerStore.getState();

export const mathTestTimer = {
  startMathM1: () => store().startPhase("MATH_M1", MATH_TEST_TIME.MATH_MODULE),
  startMathM2: () => store().startPhase("MATH_M2", MATH_TEST_TIME.MATH_MODULE),
};