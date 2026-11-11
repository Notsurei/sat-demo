import { createTestStore } from "./creat-test-store";

export type MathTestPhase = "IDLE" | "MATH_M1" | "MATH_M2" | "FINISHED";

export const useMathTestStore = createTestStore<MathTestPhase>({
  initialPhase: "IDLE",
  fetchTestUrl: (testId) => `/api/math-module/${testId}`,
  extractTest: (data) => data.data,
});

export type {
  TestOption as MathTestOption,
  TestQuestion as MathTestQuestion,
  TestModule as MathTestModule,
  TestAnswer as MathTestAnswer,
} from "./creat-test-store";