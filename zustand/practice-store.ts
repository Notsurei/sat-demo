import { create } from "zustand";
import axios from "axios";

import type { Difficulty, PracticeMode, Subject } from "@prisma/client";
import { usePracticeConfigStore } from "./practice-config";

export interface PracticeQuestion {
  id: string;
  prompt: string;
  type: "MCQ" | "GRID_IN" | "text";
  passage?: string | null;
  hint?: string | null;
  explanation?: string | null;
  options?: {
    id: string;
    label: string;
    content: string;
  }[];
  correctOptionId?: string;
  correctAnswer?: string;
  correctTextAnswer?: string;
  difficulty?: Difficulty;
  domain?: string;
  subtopic?: string;
}

interface CreatePracticePayload {
  subject: Subject;
  mode: PracticeMode;
  domain?: string;
  subtopic?: string;
  difficulty?: Difficulty;
  questionCount?: number;
}

interface Answer {
  optionId?: string;
  textAnswer?: string;
}

interface PracticeStore {
  practiceId: string | null;
  questions: PracticeQuestion[];
  currentQuestion: number;
  answers: Record<string, Answer>;
  loading: boolean;
  error: string | null;

  createPractice: (payload: CreatePracticePayload) => Promise<void>;
  fetchPractice: (practiceId: string) => Promise<void>;
  submitPractice: (questionTimes: Record<string, number>) => Promise<any>;

  nextQuestion: () => void;
  prevQuestion: () => void;
  goToQuestion: (index: number) => void;

  setOptionAnswer: (questionId: string, optionId: string) => void;
  setTextAnswer: (questionId: string, text: string) => void;
  clearAnswer: (questionId: string) => void;

  reset: () => void;
}

export const usePracticeStore = create<PracticeStore>((set, get) => ({
  practiceId: null,
  questions: [],
  currentQuestion: 0,
  answers: {},
  loading: false,
  error: null,

  createPractice: async (payload) => {
    set({ loading: true, error: null });

    try {
      const res = await axios.post("/api/practice/create", payload);

      const questions = res.data.questions.map((q: any) => {
        const correctOpt = q.options?.find((o: any) => o.isCorrect);

        return {
          id: q.id,
          prompt: q.prompt,
          type:
            q.type === "MCQ"
              ? "MCQ"
              : q.type === "GRID_IN"
                ? "GRID_IN"
                : "text",
          explanation: q.explanation || null,
          passage: q.passage || null,
          hint: q.explanation || null,
          options:
            q.options?.map((o: any) => ({
              id: o.id,
              label: o.label,
              content: o.content,
            })) || [],
          correctOptionId: correctOpt?.id,
          correctAnswer:
            correctOpt?.label ||
            q.correctAnswer ||
            q.correctTextAnswer ||
            undefined,
          correctTextAnswer: q.correctTextAnswer || undefined,
          difficulty: q.difficulty,
          domain: q.domain,
          subtopic: q.subtopic,
        };
      });

      set({
        practiceId: res.data.practiceId,
        questions,
        currentQuestion: 0,
        answers: {},
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || "Failed to create practice",
        loading: false,
      });
      throw error;
    }
  },

  fetchPractice: async (practiceId: string) => {
    set({
      loading: true,
      error: null,
      questions: [],
      answers: {},
      practiceId: null,
    });

    try {
      const res = await axios.get(`/api/practice/practice/${practiceId}`, {
        withCredentials: true,
      });

      if (!res.data.success) {
        throw new Error(res.data.error || "Failed to load practice");
      }

      const { subject, domain, subtopic } = res.data;

      usePracticeConfigStore.setState({
        subject: subject || "",
        category: domain || "",
        subtopic: subtopic || "",
      });

      const questions = res.data.questions.map((q: any) => {
        const correctOpt = q.options?.find((o: any) => o.isCorrect);
        return {
          id: q.id,
          prompt: q.prompt,
          type:
            q.type === "MCQ"
              ? "MCQ"
              : q.type === "GRID_IN"
                ? "GRID_IN"
                : "text",
          passage: q.passage || null,
          hint: q.explanation || null,
          explanation: q.explanation || null,
          options:
            q.options?.map((o: any) => ({
              id: o.id,
              label: o.label,
              content: o.content,
            })) || [],
          correctOptionId: correctOpt?.id,
          correctAnswer:
            correctOpt?.label ||
            q.correctAnswer ||
            q.correctTextAnswer ||
            undefined,
          correctTextAnswer: q.correctTextAnswer || undefined,
          difficulty: q.difficulty,
          domain: q.domain,
          subtopic: q.subtopic,
        };
      });

      set({
        practiceId: res.data.practiceId,
        questions,
        currentQuestion: res.data.currentQuestion || 0,
        answers: res.data.answers || {},
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || "Failed to load practice",
        loading: false,
      });
      throw error;
    }
  },

  submitPractice: async (questionTimes: Record<string, number>) => {
    const { practiceId, answers } = get();

    if (!practiceId) {
      throw new Error("Practice not found");
    }

    set({
      loading: true,
      error: null,
    });

    try {
      const res = await axios.post(`/api/practice/submit/${practiceId}`, {
        answers,
        questionTimes,
      });

      set({
        loading: false,
      });

      return res.data;
    } catch (error: any) {
      set({
        loading: false,
        error: error.response?.data?.error || "Failed to submit practice",
      });

      throw error;
    }
  },

  nextQuestion: () =>
    set((state) => ({
      currentQuestion: Math.min(
        state.currentQuestion + 1,
        state.questions.length - 1,
      ),
    })),

  prevQuestion: () =>
    set((state) => ({
      currentQuestion: Math.max(state.currentQuestion - 1, 0),
    })),

  goToQuestion: (index) =>
    set((state) => ({
      currentQuestion: Math.max(0, Math.min(index, state.questions.length - 1)),
    })),

  setOptionAnswer: (questionId, optionId) =>
    set((state) => ({
      answers: {
        ...state.answers,
        [questionId]: {
          ...state.answers[questionId],
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
          ...state.answers[questionId],
          textAnswer,
          optionId: undefined,
        },
      },
    })),

  clearAnswer: (questionId) =>
    set((state) => {
      const { [questionId]: _, ...rest } = state.answers;
      return { answers: rest };
    }),

  reset: () =>
    set({
      practiceId: null,
      questions: [],
      answers: {},
      currentQuestion: 0,
      loading: false,
      error: null,
    }),
}));
