import { createTestStore } from "./creat-test-store";

export type RwTestPhase = "IDLE" | "RW_M1" | "RW_M2" | "FINISHED";

export const useRwTestStore = createTestStore<RwTestPhase>({
  initialPhase: "IDLE",
  fetchTestUrl: (testId) => `/api/rw-module/${testId}`,
  extractTest: (data) => data.data,
});

export type {
  TestOption as RwTestOption,
  TestQuestion as RwTestQuestion,
  TestModule as RwTestModule,
  TestAnswer as RwTestAnswer,
} from "./creat-test-store";