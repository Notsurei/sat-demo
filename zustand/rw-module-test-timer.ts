import { createTimerStore } from "./test-timer-store";

export type RwTestTimerPhase = "IDLE" | "RW_M1" | "RW_M2" | "FINISHED";

export const RW_TEST_TIME = {
  RW_MODULE: 32 * 60,
} as const;

export const useRwTestTimerStore = createTimerStore<RwTestTimerPhase>(
  "IDLE",
  "IDLE",
);

const store = () => useRwTestTimerStore.getState();

export const rwTestTimer = {
  startRwM1: () => store().startPhase("RW_M1", RW_TEST_TIME.RW_MODULE),
  startRwM2: () => store().startPhase("RW_M2", RW_TEST_TIME.RW_MODULE),
};