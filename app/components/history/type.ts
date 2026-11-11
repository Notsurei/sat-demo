export interface TestHistory {
  id: string;
  examId: string;
  examTitle: string;
  status: "COMPLETED" | "IN_PROGRESS" | "ABANDONED" | "EXPIRED";
  subject?: string;
  moduleNumber?: number | null;
  variant?: string | null;
  startedAt: string;
  completedAt?: string | null;
  totalQuestions: number;
  totalCorrect: number;
  totalWrong: number;
  totalSkipped: number;
  answeredQuestions?: number;
  rawScore?: number | null;
  scaledScore?: number | null;
  totalTimeSpent?: number | null;
  currentSectionOrder?: number;
  totalSections?: number;
  mathScore?: number | null;
  readingWritingScore?: number | null;
  sections?: TestSectionReport[];
}

export interface TestSectionReport {
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
  data: TestHistory;
  message?: string;
}

export interface TestHistoryProps {
  history: TestHistory[];
  loading?: boolean;
}
