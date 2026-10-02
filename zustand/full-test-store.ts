import { create } from "zustand";
import axios from "axios";

import type { Difficulty, QuestionType, Subject } from "@prisma/client";

export type FullTestPhase = "READING_WRITING" | "BREAK" | "MATH" | "FINISHED";

export interface FullTestOption {
  id: string;
  label: string;
  content: string;
}

export interface FullTestQuestion {
  id: string;
  prompt: string;
  type: QuestionType;
  passage?: string | null;
  explanation?: string | null;
  options: FullTestOption[];
  difficulty?: Difficulty | null;
  domain?: string | null;
  subtopic?: string | null;
}

export interface FullTestModule {
  id: string;
  order: number;
  subject: Subject;
  title: string;
  duration: number;
  questionCount: number;
  breakAfter: number | null;
  variant: "EASY" | "MEDIUM" | "HARD" | null;
  moduleNumber: number;
  questions: FullTestQuestion[];
}

export interface FullTestAnswer {
  optionId?: string;
  textAnswer?: string;
}

interface FullTestStore {
  testId: string | null;
  title: string | null;
  modules: FullTestModule[];
  phase: FullTestPhase;
  currentModuleIndex: number;
  currentQuestionIndex: number;
  answers: Record<string, FullTestAnswer>;
  flaggedQuestions: Record<string, boolean>;
  loading: boolean;
  error: string | null;
  initialized: boolean;

  fetchTest: (testId: string) => Promise<void>;

  loadFromSession: (data: {
    examId: string;
    title: string;
    sections: any[];
  }) => void;

  setPhase: (phase: FullTestPhase) => void;

  startReadingWriting: () => void;
  startBreak: () => void;
  startMath: () => void;
  finishTest: () => void;

  setCurrentModule: (index: number) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  goToQuestion: (index: number) => void;

  setOptionAnswer: (questionId: string, optionId: string) => void;
  setTextAnswer: (questionId: string, textAnswer: string) => void;
  clearAnswer: (questionId: string) => void;

  toggleFlagQuestion: (questionId: string) => void;
  flagQuestion: (questionId: string) => void;
  unflagQuestion: (questionId: string) => void;

  getCurrentModule: () => FullTestModule | null;
  getCurrentQuestion: () => FullTestQuestion | null;
  getCurrentQuestions: () => FullTestQuestion[];

  getAnsweredCount: (moduleIndex?: number) => number;
  getFlaggedCount: (moduleIndex?: number) => number;

  isQuestionAnswered: (questionId: string) => boolean;
  isQuestionFlagged: (questionId: string) => boolean;

  reset: () => void;
}

const initialState = {
  testId: null,
  title: null,
  modules: [],
  phase: "READING_WRITING" as FullTestPhase,
  currentModuleIndex: 0,
  currentQuestionIndex: 0,
  answers: {},
  flaggedQuestions: {},
  loading: false,
  error: null,
  initialized: false,
};

/* -------------------------------------------------------------------------- */
/*                                HELPERS                                     */
/* -------------------------------------------------------------------------- */

/**
 * Gán moduleNumber theo thứ tự trong từng subject.
 * R&W: 1, 2 ; Math: 1, 2
 */
function assignModuleNumbers(mods: FullTestModule[]): FullTestModule[] {
  const counter: Record<string, number> = {};
  return mods.map((m) => {
    counter[m.subject] = (counter[m.subject] ?? 0) + 1;
    return { ...m, moduleNumber: counter[m.subject] };
  });
}

/**
 * Suy ra variant từ độ khó trung bình của câu hỏi.
 * CHỈ dùng cho Module 2 — Module 1 luôn null.
 */
function deriveVariant(qs: FullTestQuestion[]): FullTestModule["variant"] {
  if (!qs.length) return null;

  const score: Record<string, number> = { EASY: 1, MEDIUM: 2, HARD: 3 };
  const total = qs.reduce((s, q) => {
    const d = q.difficulty ?? "MEDIUM";
    return s + (score[d] ?? 2);
  }, 0);
  const avg = total / qs.length;

  if (avg < 1.67) return "EASY";
  if (avg > 2.33) return "HARD";
  return "MEDIUM";
}

/**
 * Map 1 question raw (từ API / session) -> FullTestQuestion
 */
function mapQuestion(question: any): FullTestQuestion {
  return {
    id: question.id,
    prompt: question.prompt,
    type: question.type,
    passage: question.passage ?? null,
    explanation: question.explanation ?? null,
    options:
      question.options?.map((option: any) => ({
        id: option.id,
        label: option.label,
        content: option.content,
      })) ?? [],
    difficulty: question.difficulty ?? null,
    domain: question.domain ?? null,
    subtopic: question.subtopic ?? null,
  };
}

/**
 * Sau khi đã gán moduleNumber (1, 2 theo từng subject), resolve variant:
 * - Nếu API đã trả variant hợp lệ (EASY/MEDIUM/HARD) → giữ nguyên.
 * - Ngược lại, nếu là Module 2 → derive từ difficulty câu hỏi.
 * - Module 1 → luôn null.
 */
function resolveVariantForModule(
  module: FullTestModule,
): FullTestModule["variant"] {
  const apiVariant = module.variant;

  if (
    apiVariant === "EASY" ||
    apiVariant === "MEDIUM" ||
    apiVariant === "HARD"
  ) {
    return apiVariant;
  }

  if (module.moduleNumber === 2) {
    return deriveVariant(module.questions);
  }

  return null;
}

/* -------------------------------------------------------------------------- */
/*                                   STORE                                    */
/* -------------------------------------------------------------------------- */

export const useFullTestStore = create<FullTestStore>((set, get) => ({
  ...initialState,

  fetchTest: async (testId) => {
    set({
      ...initialState,
      loading: true,
      error: null,
    });

    try {
      const res = await axios.get(`/api/full-test/${testId}`, {
        withCredentials: true,
      });

      if (!res.data.success) {
        throw new Error(res.data.error || "Failed to load full test");
      }

      const test = res.data.test;

      // 1) sort theo order
      const sortedModules = (test.modules ?? [])
        .slice()
        .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));

      // 2) map raw -> FullTestModule (chưa resolve variant, moduleNumber = 0)
      const rawModules: FullTestModule[] = sortedModules.map(
        (module: any): FullTestModule => {
          const mappedQuestions: FullTestQuestion[] =
            module.questions?.map(mapQuestion) ?? [];

          return {
            id: module.id,
            order: module.order,
            subject: module.subject,
            title: module.title,
            duration: module.duration,
            questionCount: mappedQuestions.length,
            breakAfter: module.breakAfter ?? null,
            // Lưu tạm variant từ API (nếu có) — sẽ resolve sau
            variant: module.variant ?? null,
            moduleNumber: 0, // sẽ gán ở bước 3
            questions: mappedQuestions,
          };
        },
      );

      // 3) gán moduleNumber theo từng subject (1, 2)
      const modulesWithNumbers = assignModuleNumbers(rawModules);

      // 4) resolve variant — dùng moduleNumber ĐÃ GÁN, không dùng từ API
      const modules: FullTestModule[] = modulesWithNumbers.map((m) => ({
        ...m,
        variant: resolveVariantForModule(m),
      }));

      set({
        testId: test.id,
        title: test.title,
        modules,
        phase: "READING_WRITING",
        currentModuleIndex: 0,
        currentQuestionIndex: 0,
        answers: {},
        flaggedQuestions: {},
        loading: false,
        error: null,
        initialized: true,
      });
    } catch (error: any) {
      console.error("FETCH FULL TEST ERROR:", error);

      set({
        loading: false,
        initialized: false,
        error:
          error.response?.data?.error ||
          error.message ||
          "Failed to load full test",
      });

      throw error;
    }
  },

  loadFromSession: ({ examId, title, sections }) => {
    // 1) sort theo order của section
    const sortedSections = (sections ?? [])
      .slice()
      .sort((a, b) => (a.section?.order ?? 0) - (b.section?.order ?? 0));

    // 2) map -> FullTestModule (chưa resolve variant, moduleNumber = 0)
    const rawModules: FullTestModule[] = sortedSections.map(
      (section: any): FullTestModule => {
        const mappedQuestions: FullTestQuestion[] =
          section.questions?.map((item: any) => mapQuestion(item.question)) ??
          [];

        return {
          id: section.id,
          order: section.section.order,
          subject: section.section.subject,
          title: section.section.title,
          duration: section.section.duration,
          questionCount: mappedQuestions.length,
          breakAfter: section.section.breakAfter ?? null,
          // Lưu tạm variant từ API (nếu có)
          variant: section.section.variant ?? null,
          moduleNumber: 0, // gán ở bước 3
          questions: mappedQuestions,
        };
      },
    );

    // 3) gán moduleNumber theo từng subject (1, 2)
    const modulesWithNumbers = assignModuleNumbers(rawModules);

    // 4) resolve variant — dùng moduleNumber ĐÃ GÁN
    const modules: FullTestModule[] = modulesWithNumbers.map((m) => ({
      ...m,
      variant: resolveVariantForModule(m),
    }));

    set({
      testId: examId,
      title,
      modules,
      phase: "READING_WRITING",
      currentModuleIndex: 0,
      currentQuestionIndex: 0,
      answers: {},
      flaggedQuestions: {},
      loading: false,
      error: null,
      initialized: true,
    });
  },

  setPhase: (phase) =>
    set({
      phase,
    }),

  startReadingWriting: () =>
    set({
      phase: "READING_WRITING",
      currentModuleIndex: 0,
      currentQuestionIndex: 0,
    }),

  startBreak: () =>
    set({
      phase: "BREAK",
    }),

  startMath: () =>
    set((state) => {
      const mathModuleIndex = state.modules.findIndex(
        (module) => module.subject === "SAT_MATH",
      );

      return {
        phase: "MATH",
        currentModuleIndex: mathModuleIndex >= 0 ? mathModuleIndex : 1,
        currentQuestionIndex: 0,
      };
    }),

  finishTest: () =>
    set({
      phase: "FINISHED",
    }),

  setCurrentModule: (index) =>
    set((state) => {
      if (index < 0 || index >= state.modules.length) {
        return {};
      }

      return {
        currentModuleIndex: index,
        currentQuestionIndex: 0,
      };
    }),

  nextQuestion: () =>
    set((state) => {
      const currentModule = state.modules[state.currentModuleIndex];

      if (!currentModule) {
        return {};
      }

      const lastQuestionIndex = currentModule.questions.length - 1;

      return {
        currentQuestionIndex: Math.min(
          state.currentQuestionIndex + 1,
          lastQuestionIndex,
        ),
      };
    }),

  prevQuestion: () =>
    set((state) => ({
      currentQuestionIndex: Math.max(state.currentQuestionIndex - 1, 0),
    })),

  goToQuestion: (index) =>
    set((state) => {
      const currentModule = state.modules[state.currentModuleIndex];

      if (!currentModule) {
        return {};
      }

      const lastQuestionIndex = currentModule.questions.length - 1;

      return {
        currentQuestionIndex: Math.max(0, Math.min(index, lastQuestionIndex)),
      };
    }),

  setOptionAnswer: (questionId, optionId) =>
    set((state) => ({
      answers: {
        ...state.answers,
        [questionId]: {
          optionId,
          textAnswer: undefined,
        },
      },
    })),

  setTextAnswer: (questionId, textAnswer) =>
    set((state) => ({
      answers: {
        ...state.answers,
        [questionId]: {
          optionId: undefined,
          textAnswer,
        },
      },
    })),

  clearAnswer: (questionId) =>
    set((state) => {
      const { [questionId]: _, ...remainingAnswers } = state.answers;

      return {
        answers: remainingAnswers,
      };
    }),

  toggleFlagQuestion: (questionId) =>
    set((state) => ({
      flaggedQuestions: {
        ...state.flaggedQuestions,
        [questionId]: !state.flaggedQuestions[questionId],
      },
    })),

  flagQuestion: (questionId) =>
    set((state) => ({
      flaggedQuestions: {
        ...state.flaggedQuestions,
        [questionId]: true,
      },
    })),

  unflagQuestion: (questionId) =>
    set((state) => ({
      flaggedQuestions: {
        ...state.flaggedQuestions,
        [questionId]: false,
      },
    })),

  getCurrentModule: () => {
    const state = get();
    return state.modules[state.currentModuleIndex] ?? null;
  },

  getCurrentQuestions: () => {
    const state = get();
    return state.modules[state.currentModuleIndex]?.questions ?? [];
  },

  getCurrentQuestion: () => {
    const state = get();

    const currentModule = state.modules[state.currentModuleIndex];

    if (!currentModule) {
      return null;
    }

    return currentModule.questions[state.currentQuestionIndex] ?? null;
  },

  getAnsweredCount: (moduleIndex) => {
    const state = get();

    const index = moduleIndex ?? state.currentModuleIndex;
    const module = state.modules[index];

    if (!module) {
      return 0;
    }

    return module.questions.filter((question) => {
      const answer = state.answers[question.id];

      if (!answer) {
        return false;
      }

      return Boolean(answer.optionId || answer.textAnswer);
    }).length;
  },

  getFlaggedCount: (moduleIndex) => {
    const state = get();

    const index = moduleIndex ?? state.currentModuleIndex;
    const module = state.modules[index];

    if (!module) {
      return 0;
    }

    return module.questions.filter(
      (question) => state.flaggedQuestions[question.id] === true,
    ).length;
  },

  isQuestionAnswered: (questionId) => {
    const answer = get().answers[questionId];

    if (!answer) {
      return false;
    }

    return Boolean(answer.optionId || answer.textAnswer);
  },

  isQuestionFlagged: (questionId) =>
    get().flaggedQuestions[questionId] === true,

  reset: () => {
    set({
      ...initialState,
    });
  },
}));
