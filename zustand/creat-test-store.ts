import { create } from "zustand";
import axios from "axios";
import type { Difficulty, QuestionType, Subject } from "@prisma/client";

export interface TestOption {
  id: string;
  label: string;
  content: string;
}

export interface TestQuestion {
  id: string;
  prompt: string;
  type: QuestionType;
  passage?: string | null;
  explanation?: string | null;
  options: TestOption[];
  difficulty?: Difficulty | null;
  domain?: string | null;
  subtopic?: string | null;
}

export interface TestModule {
  id: string;
  order: number;
  subject: Subject;
  title: string;
  duration: number;
  questionCount: number;
  breakAfter: number | null;
  variant: "EASY" | "MEDIUM" | "HARD" | null;
  moduleNumber: number;
  questions: TestQuestion[];
}

export interface TestAnswer {
  optionId?: string | null;
  textAnswer?: string | null;
}

export interface TestStore<TPhase extends string> {
  testId: string | null;
  title: string | null;
  modules: TestModule[];
  phase: TPhase;
  currentModuleIndex: number;
  currentQuestionIndex: number;
  answers: Record<string, TestAnswer>;
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

  setPhase: (phase: TPhase) => void;
  setCurrentModule: (index: number) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  goToQuestion: (index: number) => void;

  setOptionAnswer: (questionId: string, optionId: string) => void;
  setTextAnswer: (questionId: string, text: string) => void;
  clearAnswer: (questionId: string) => void;

  toggleFlagQuestion: (questionId: string) => void;
  flagQuestion: (questionId: string) => void;
  unflagQuestion: (questionId: string) => void;

  getCurrentModule: () => TestModule | null;
  getCurrentQuestion: () => TestQuestion | null;
  getCurrentQuestions: () => TestQuestion[];

  getAnsweredCount: (moduleIndex?: number) => number;
  getFlaggedCount: (moduleIndex?: number) => number;

  isQuestionAnswered: (questionId: string) => boolean;
  isQuestionFlagged: (questionId: string) => boolean;

  reset: () => void;
}

function assignModuleNumbers(mods: TestModule[]): TestModule[] {
  const counter: Record<string, number> = {};
  return mods.map((m) => {
    counter[m.subject] = (counter[m.subject] ?? 0) + 1;
    return { ...m, moduleNumber: counter[m.subject] };
  });
}

function deriveVariant(qs: TestQuestion[]): TestModule["variant"] {
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

function mapQuestion(question: any): TestQuestion {
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

function resolveVariantForModule(module: TestModule): TestModule["variant"] {
  const v = module.variant;
  if (v === "EASY" || v === "MEDIUM" || v === "HARD") return v;
  if (module.moduleNumber === 2) return deriveVariant(module.questions);
  return null;
}

export interface CreateTestStoreOptions<TPhase extends string> {
  initialPhase: TPhase;
  fetchTestUrl: (testId: string) => string;
  extractTest: (responseData: any) => any;
  extraMethods?: Record<string, any>;
}

export function createTestStore<TPhase extends string>(
  opts: CreateTestStoreOptions<TPhase>,
) {
  const initialState = {
    testId: null,
    title: null,
    modules: [] as TestModule[],
    phase: opts.initialPhase,
    currentModuleIndex: 0,
    currentQuestionIndex: 0,
    answers: {} as Record<string, TestAnswer>,
    flaggedQuestions: {} as Record<string, boolean>,
    loading: false,
    error: null as string | null,
    initialized: false,
  };

  return create<TestStore<TPhase>>((set, get) => ({
    ...initialState,

    fetchTest: async (testId) => {
      set({ ...initialState, loading: true, error: null });

      try {
        const res = await axios.get(opts.fetchTestUrl(testId), {
          withCredentials: true,
        });

        if (!res.data.success) {
          throw new Error(res.data.error || "Failed to load test");
        }

        const test = opts.extractTest(res.data);

        const sortedModules = (test.modules ?? [])
          .slice()
          .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));

        const rawModules: TestModule[] = sortedModules.map(
          (module: any): TestModule => {
            const mappedQuestions: TestQuestion[] =
              module.questions?.map(mapQuestion) ?? [];

            return {
              id: module.id,
              order: module.order,
              subject: module.subject,
              title: module.title,
              duration: module.duration,
              questionCount: mappedQuestions.length,
              breakAfter: module.breakAfter ?? null,
              variant: module.variant ?? null,
              moduleNumber: 0,
              questions: mappedQuestions,
            };
          },
        );

        const modules: TestModule[] = assignModuleNumbers(rawModules).map(
          (m) => ({ ...m, variant: resolveVariantForModule(m) }),
        );

        set({
          testId: test.id,
          title: test.title,
          modules,
          phase: opts.initialPhase,
          currentModuleIndex: 0,
          currentQuestionIndex: 0,
          answers: {},
          flaggedQuestions: {},
          loading: false,
          error: null,
          initialized: true,
        });
      } catch (error: any) {
        console.error("FETCH TEST ERROR:", error);
        set({
          loading: false,
          initialized: false,
          error:
            error.response?.data?.error ||
            error.message ||
            "Failed to load test",
        });
        throw error;
      }
    },

    loadFromSession: ({ examId, title, sections }) => {
      const sortedSections = (sections ?? [])
        .slice()
        .sort((a, b) => (a.section?.order ?? 0) - (b.section?.order ?? 0));

      const rawModules: TestModule[] = sortedSections.map(
        (section: any): TestModule => {
          const mappedQuestions: TestQuestion[] =
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
            variant: section.section.variant ?? null,
            moduleNumber: 0,
            questions: mappedQuestions,
          };
        },
      );

      const modules: TestModule[] = assignModuleNumbers(rawModules).map(
        (m) => ({ ...m, variant: resolveVariantForModule(m) }),
      );

      set({
        testId: examId,
        title,
        modules,
        phase: opts.initialPhase,
        currentModuleIndex: 0,
        currentQuestionIndex: 0,
        answers: {},
        flaggedQuestions: {},
        loading: false,
        error: null,
        initialized: true,
      });
    },

    setPhase: (phase) => set({ phase }),

    setCurrentModule: (index) =>
      set((state) => {
        if (index < 0 || index >= state.modules.length) return {};
        return { currentModuleIndex: index, currentQuestionIndex: 0 };
      }),

    nextQuestion: () =>
      set((state) => {
        const currentModule = state.modules[state.currentModuleIndex];
        if (!currentModule) return {};
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
        if (!currentModule) return {};
        const lastQuestionIndex = currentModule.questions.length - 1;
        return {
          currentQuestionIndex: Math.max(0, Math.min(index, lastQuestionIndex)),
        };
      }),

    setOptionAnswer: (questionId, optionId) =>
      set((state) => ({
        answers: {
          ...state.answers,
          [questionId]: { optionId, textAnswer: undefined },
        },
      })),

    setTextAnswer: (questionId, textAnswer) =>
      set((state) => ({
        answers: {
          ...state.answers,
          [questionId]: { optionId: undefined, textAnswer },
        },
      })),

    clearAnswer: (questionId) =>
      set((state) => {
        const { [questionId]: _, ...remainingAnswers } = state.answers;
        return { answers: remainingAnswers };
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
        flaggedQuestions: { ...state.flaggedQuestions, [questionId]: true },
      })),

    unflagQuestion: (questionId) =>
      set((state) => ({
        flaggedQuestions: { ...state.flaggedQuestions, [questionId]: false },
      })),

    /* ── Getters ────────────────────────── */

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
      if (!currentModule) return null;
      return currentModule.questions[state.currentQuestionIndex] ?? null;
    },

    getAnsweredCount: (moduleIndex) => {
      const state = get();
      const index = moduleIndex ?? state.currentModuleIndex;
      const module = state.modules[index];
      if (!module) return 0;
      return module.questions.filter((q) => {
        const answer = state.answers[q.id];
        if (!answer) return false;
        return Boolean(answer.optionId || answer.textAnswer);
      }).length;
    },

    getFlaggedCount: (moduleIndex) => {
      const state = get();
      const index = moduleIndex ?? state.currentModuleIndex;
      const module = state.modules[index];
      if (!module) return 0;
      return module.questions.filter(
        (q) => state.flaggedQuestions[q.id] === true,
      ).length;
    },

    isQuestionAnswered: (questionId) => {
      const answer = get().answers[questionId];
      if (!answer) return false;
      return Boolean(answer.optionId || answer.textAnswer);
    },

    isQuestionFlagged: (questionId) =>
      get().flaggedQuestions[questionId] === true,

    reset: () => set({ ...initialState }),

    ...(opts.extraMethods ?? {}),
  }));
}
