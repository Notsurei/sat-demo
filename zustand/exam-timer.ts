import { create } from "zustand";

interface ExamTimer {
  remainingTime: number;

  setRemainingTime: (time: number) => void;
}

export const useExamStore = create<ExamTimer>((set) => ({
  remainingTime: 0,
  setRemainingTime: (remainingTime) =>
    set({
      remainingTime,
    }),
}));
