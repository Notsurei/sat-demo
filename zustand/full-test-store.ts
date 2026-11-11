import { createTestStore } from "./creat-test-store";

export type FullTestPhase =
  | "READING_WRITING"
  | "BREAK"
  | "MATH"
  | "FINISHED";

export const useFullTestStore = createTestStore<FullTestPhase>({
  initialPhase: "READING_WRITING",
  fetchTestUrl: (testId) => `/api/full-test/${testId}`,
  extractTest: (data) => data.test,

  extraMethods: {
    startReadingWriting: () => {
      useFullTestStore.setState({
        phase: "READING_WRITING",
        currentModuleIndex: 0,
        currentQuestionIndex: 0,
      });
    },
    startBreak: () => useFullTestStore.setState({ phase: "BREAK" }),
    startMath: () =>
      useFullTestStore.setState((state) => {
        const mathModuleIndex = state.modules.findIndex(
          (m) => m.subject === "SAT_MATH",
        );
        return {
          phase: "MATH",
          currentModuleIndex: mathModuleIndex >= 0 ? mathModuleIndex : 1,
          currentQuestionIndex: 0,
        };
      }),
    finishTest: () => useFullTestStore.setState({ phase: "FINISHED" }),
  },
});

export type {
  TestOption as FullTestOption,
  TestQuestion as FullTestQuestion,
  TestModule as FullTestModule,
  TestAnswer as FullTestAnswer,
} from "./creat-test-store";