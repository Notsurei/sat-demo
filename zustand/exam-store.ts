import { create } from "zustand";
import axios from "axios";

interface Answer {
  questionId: string;
  selectedQuestionId?: string;
  textAnswer?: string;
}

interface ExamState {
  examId: string | null;
  attemptId: string | null;
  currentQuestionIndex: number;
  answers: Record<string, Answer>;
  isLoading: boolean;
  error: string | null;

  setExamId: (id: string) => void;
  setAttemptId: (id: string) => void;
  setAnswer: (questionId: string, answer: Answer) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  reset: () => void;

  startExam: (examId: string) => Promise<any>;
  submitExam: () => Promise<any>;
}

export const useExamStore = create<ExamState>((set, get) => ({
  examId: null,
  attemptId: null,
  currentQuestionIndex: 0,
  answers: {},
  isLoading: false,
  error: null,

  setExamId: (id) =>
    set({
      examId: id,
    }),

  setAttemptId: (id) =>
    set({
      attemptId: id,
    }),

  setAnswer: (questionId, answer) =>
    set((state) => ({
      answers: {
        ...state.answers,
        [questionId]: answer,
      },
    })),

  nextQuestion: () =>
    set((state) => ({
      currentQuestionIndex: state.currentQuestionIndex + 1,
    })),

  prevQuestion: () =>
    set((state) => ({
      currentQuestionIndex: Math.max(0, state.currentQuestionIndex - 1),
    })),

  reset: () =>
    set({
      examId: null,
      attemptId: null,
      currentQuestionIndex: 0,
      answers: {},
      isLoading: false,
      error: null,
    }),

  startExam: async (examId: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.post(`/api/exams/start-exam/${examId}`);
      const { attemptId } = res.data;
      set({
        examId,
        attemptId,
        isLoading: false,
        currentQuestionIndex: 0,
        answers: {},
      });
      return res.data;
    } catch (error: any) {
      const message = error?.response?.data?.error || "Failed to start exam";
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  submitExam: async () => {
    const { examId, attemptId, answers } = get();
    if (!attemptId) throw new Error("No active attempt");
    if (!examId) throw new Error("No active exam");

    set({ isLoading: true, error: null });
    try {
      const res = await axios.post(`/api/exams/${examId}/submit`, {
        attemptId,
        answers,
      });
      set({ isLoading: false });
      return res.data;
    } catch (error: any) {
      const message = error?.response?.data?.error || "Failed to submit exam";
      set({ isLoading: false, error: message });
      throw error;
    }
  },
}));
