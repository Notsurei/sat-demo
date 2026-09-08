import { create } from 'zustand';

export interface PracticeConfig {
  subject: string;
  mode: string;
  domain?: string;
  category?: string;
  subtopic?: string;
  questionCount: number;
}

interface PracticeConfigStore extends PracticeConfig {
  setConfig: (config: Partial<PracticeConfig>) => void;
  resetConfig: () => void;
}

const defaultConfig: PracticeConfig = {
  subject: 'SAT_MATH',
  mode: 'ALL_LEVEL',
  domain: undefined,
  subtopic: undefined,
  questionCount: 10,
};

export const usePracticeConfigStore = create<PracticeConfigStore>((set) => ({
  ...defaultConfig,
  setConfig: (config) => set((state) => ({ ...state, ...config })),
  resetConfig: () => set(defaultConfig),
}));