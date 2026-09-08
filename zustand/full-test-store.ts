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

      const modules: FullTestModule[] = test.modules.map(
        (module: any): FullTestModule => ({
          id: module.id,

          order: module.order,

          subject: module.subject,

          title: module.title,

          duration: module.duration,

          questionCount: module.questions?.length ?? 0,

          questions:
            module.questions?.map(
              (question: any): FullTestQuestion => ({
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
              }),
            ) ?? [],
        }),
      );

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
