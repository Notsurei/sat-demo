"use client";

import FullTestHistoryCard from "./full-test-history-card";

interface FullTest {
  id: string;
  examId: string;
  examTitle: string;
  status: "IN_PROGRESS" | "BREAK" | "COMPLETED" | "EXPIRED";
  currentSectionOrder: number;
  totalSections: number;
  totalQuestions: number;
  totalCorrect: number;
  totalWrong: number;
  totalSkipped: number;
  rawScore?: number | null;
  scaledScore?: number | null;
  totalTimeSpent?: number | null;
  startedAt: string;
  completedAt?: string | null;
}

interface FullTestHistoryListProps {
  tests: FullTest[];
  onAction?: (test: FullTest) => void;
}

export default function FullTestHistoryList({
  tests,
  onAction,
}: FullTestHistoryListProps) {
  if (tests.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <p className="font-semibold text-slate-700">
          No full test history yet
        </p>

        <p className="mt-1 text-sm text-slate-400">
          Complete your first full test to see it here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {tests.map((test) => (
        <FullTestHistoryCard
          key={test.id}
          test={test}
          onAction={onAction}
        />
      ))}
    </div>
  );
}