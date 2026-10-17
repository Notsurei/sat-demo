export interface FullTestHistory {
  id: string;
  examId: string;

  examTitle: string;

  status: "COMPLETED" | "IN_PROGRESS" | "ABANDONED";

  startedAt: string;
  completedAt?: string | null;

  totalQuestions: number;
  answeredQuestions: number;
  correct: number;

  scaledScore?: number | null;

  mathScore?: number | null;
  readingWritingScore?: number | null;

  sections: FullTestSectionReport[];
}

export interface FullTestSectionReport {
  id: string;
  examSectionId: string;

  title: string;
  subject: string;
  order: number;

  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;

  score?: number | null;
  percentage?: number | null;

  completedAt?: string | null;
}

export interface FullTestReportApiResponse {
  success: boolean;
  data: FullTestHistory;
  message?: string;
}