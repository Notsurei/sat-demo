export interface Practice {
  id: string;
  subject: string;
  domain?: string | null;
  subtopic?: string | null;
  totalQuestions: number;
  correctAnswers: number;
  score?: number | null;
  timeSpent?: number | null;
  startedAt: string;
  completedAt?: string | null;
  status: string;
  mode: string;
}