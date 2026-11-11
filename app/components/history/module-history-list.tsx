"use client";

import { useTranslations } from "next-intl";
import type { TestHistory } from "./type";
import ModuleHistoryCard from "./module-history-card";

interface ModuleHistoryListProps {
  tests: TestHistory[];
  subjectLabel: string;
  onAction?: (test: TestHistory) => void;
}

export default function ModuleHistoryList({
  tests,
  subjectLabel,
  onAction,
}: ModuleHistoryListProps) {
  const t = useTranslations("moduleReportCommon.list");

  if (tests.length === 0) {
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
      {tests.map((test) => (
        <ModuleHistoryCard
          key={test.id}
          test={test}
          subjectLabel={subjectLabel}
          onAction={onAction}
        />
      ))}
    </div>
  );
}