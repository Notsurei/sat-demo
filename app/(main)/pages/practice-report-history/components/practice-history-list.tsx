"use client";

import PracticeHistoryCard from "./practice-history-card";

interface Practice {
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

interface PracticeHistoryListProps {
  practices: Practice[];
  onAction?: (practice: Practice) => void;
}

export default function PracticeHistoryList({
  practices,
  onAction,
}: PracticeHistoryListProps) {
  if (practices.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <p className="font-semibold text-slate-700">
          No practice history yet
        </p>

        <p className="mt-1 text-sm text-slate-400">
          Complete your first practice session to see it here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {practices.map((practice) => (
        <PracticeHistoryCard
          key={practice.id}
          practice={practice}
          onAction={onAction}
        />
      ))}
    </div>
  );
}