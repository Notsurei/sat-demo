"use client";

import React from "react";
import { Card } from "@heroui/react";
import { useTranslations } from "next-intl";

import {
  TargetDart,
  ChartColumnStacked,
  PencilToLine,
  FileText,
} from "@gravity-ui/icons";

import { PracticeHistory } from "../hooks/use-dashboard-data";
import { FullTestHistory } from "../../full-test-report-history/components/type";

interface DashboardStatsProps {
  history?: PracticeHistory[];
  fullTestHistory?: FullTestHistory[];
}

const isPracticeCompleted = (p: PracticeHistory): boolean => {
  const status = String(p.status ?? "").toUpperCase();
  if (status === "DONE" || status === "COMPLETED" || status === "FINISHED") {
    return true;
  }
  return p.score !== null && p.score !== undefined;
};

const hasPracticeAnswers = (p: PracticeHistory): boolean => {
  const totalQ = p.totalQuestions ?? 0;
  if (totalQ === 0) return false;
  const status = String(p.status ?? "").toUpperCase();
  if (status === "ABANDONED") return false;
  return true;
};

const isFullTestCompleted = (t: FullTestHistory): boolean => {
  const status = String(t.status ?? "").toUpperCase();
  return status === "COMPLETED" || status === "DONE";
};

const computePracticeScore = (p: PracticeHistory): number | null => {
  if (p.score !== null && p.score !== undefined) return p.score;
  if (!p.totalQuestions || p.totalQuestions === 0) return null;
  return Math.round((p.correctAnswers / p.totalQuestions) * 100);
};

const computeFullTestScaledScore = (ft: FullTestHistory): number | null => {
  if (ft.scaledScore !== null && ft.scaledScore !== undefined) {
    return ft.scaledScore;
  }

  if (
    ft.mathScore !== null &&
    ft.mathScore !== undefined &&
    ft.readingWritingScore !== null &&
    ft.readingWritingScore !== undefined
  ) {
    return ft.mathScore + ft.readingWritingScore;
  }

  const rwSections =
    ft.sections?.filter(
      (s) =>
        s.subject?.toUpperCase().includes("RW") ||
        s.subject?.toUpperCase().includes("READING"),
    ) ?? [];
  const mathSections =
    ft.sections?.filter((s) => s.subject?.toUpperCase().includes("MATH")) ?? [];

  const computeSectionScaled = (
    sections: typeof ft.sections,
  ): number | null => {
    const total = sections.reduce((sum, s) => sum + (s.totalQuestions || 0), 0);
    const correct = sections.reduce(
      (sum, s) => sum + (s.correctAnswers || 0),
      0,
    );
    if (total === 0) return null;
    return Math.round(200 + (correct / total) * 600);
  };

  const rwScaled = computeSectionScaled(rwSections);
  const mathScaled = computeSectionScaled(mathSections);

  if (rwScaled !== null && mathScaled !== null) {
    return rwScaled + mathScaled;
  }
  if (rwScaled !== null) return rwScaled;
  if (mathScaled !== null) return mathScaled;

  const totalQ = ft.totalQuestions || 0;
  const totalCorrect = ft.correct || 0;
  if (totalQ === 0) return null;
  return Math.round(400 + (totalCorrect / totalQ) * 1200);
};

export default function DashboardStats({
  history = [],
  fullTestHistory = [],
}: DashboardStatsProps) {
  const t = useTranslations("dashboard.stats");

  const stats = React.useMemo(() => {
    const safeHistory = Array.isArray(history) ? history : [];
    const safeFullTestHistory = Array.isArray(fullTestHistory)
      ? fullTestHistory
      : [];

    const completedPractices = safeHistory.filter(isPracticeCompleted);
    const completedFullTests = safeFullTestHistory.filter(isFullTestCompleted);

    const latestPractice = completedPractices[0];
    const latestFullTest = completedFullTests[0];

    const practiceScore = latestPractice
      ? computePracticeScore(latestPractice)
      : null;

    const fullTestScore = latestFullTest
      ? computeFullTestScaledScore(latestFullTest)
      : null;

    const currentScore =
      practiceScore !== null
        ? practiceScore
        : fullTestScore !== null
          ? fullTestScore
          : "--";

    const currentScoreLabel =
      practiceScore !== null
        ? t("trends.latestPractice")
        : fullTestScore !== null
          ? t("trends.latestFullTest")
          : t("trends.noCompletedTests");

    const practicesWithAnswers = safeHistory.filter(hasPracticeAnswers);

    const practiceTotalCorrect = practicesWithAnswers.reduce(
      (total, p) => total + (p.correctAnswers || 0),
      0,
    );

    const practiceTotalQuestions = practicesWithAnswers.reduce(
      (total, p) => total + (p.totalQuestions || 0),
      0,
    );

    const accuracy =
      practiceTotalQuestions > 0
        ? Math.round((practiceTotalCorrect / practiceTotalQuestions) * 100)
        : 0;

    const accuracyDisplay =
      practiceTotalQuestions > 0 ? `${accuracy}%` : "--";

    return [
      {
        key: "currentScore",
        label: t("currentScore"),
        value: currentScore,
        trend: currentScoreLabel,
        icon: <TargetDart className="h-6 w-6" />,
        iconClass: "bg-danger/10 text-danger",
      },
      {
        key: "practiceAccuracy",
        label: t("practiceAccuracy"),
        value: accuracyDisplay,
        trend:
          practiceTotalQuestions > 0
            ? t("trends.correctFraction", {
                correct: practiceTotalCorrect,
                total: practiceTotalQuestions,
              })
            : t("trends.noPracticeData"),
        icon: <ChartColumnStacked className="h-6 w-6" />,
        iconClass: "bg-success/10 text-success",
      },
      {
        key: "practiceSessions",
        label: t("practiceSessions"),
        value: safeHistory.length,
        trend:
          safeHistory.length > 0
            ? t("trends.completedCount", {
                count: completedPractices.length,
              })
            : t("trends.noSessions"),
        icon: <PencilToLine className="h-6 w-6" />,
        iconClass: "bg-primary/10 text-primary",
      },
      {
        key: "fullTestSessions",
        label: t("fullTestSessions"),
        value: safeFullTestHistory.length,
        trend:
          safeFullTestHistory.length > 0
            ? t("trends.completedCount", {
                count: completedFullTests.length,
              })
            : t("trends.noSessions"),
        icon: <FileText className="h-6 w-6" />,
        iconClass: "bg-secondary/10 text-secondary",
      },
    ];
  }, [history, fullTestHistory, t]);

  return (
    <section className="mb-8">
      <h2 className="mb-4 text-lg font-semibold leading-tight">
        {t("sectionLabel")}
      </h2>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card
            key={stat.key}
            className="border border-default-200 bg-background shadow-sm"
          >
            <Card.Content className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${stat.iconClass}`}
                >
                  {stat.icon}
                </div>

                <span className="text-right text-xs leading-snug text-default-400">
                  {stat.trend}
                </span>
              </div>

              <p className="mt-5 text-2xl font-bold leading-tight">
                {stat.value}
              </p>

              <p className="mt-1 text-sm leading-snug text-default-500">
                {stat.label}
              </p>
            </Card.Content>
          </Card>
        ))}
      </div>
    </section>
  );
}