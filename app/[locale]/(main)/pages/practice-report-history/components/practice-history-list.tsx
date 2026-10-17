"use client";

import { useTranslations } from "next-intl";

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
  const t = useTranslations("practiceReport.practiceHistory.list");

  if (practices.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <p className="font-semibold leading-tight text-slate-700">
          {t("emptyTitle")}
        </p>

        <p className="mt-1 text-sm leading-relaxed text-slate-400">
          {t("emptyDescription")}
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