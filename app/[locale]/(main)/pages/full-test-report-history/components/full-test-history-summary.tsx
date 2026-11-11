"use client";

import React from "react";
import {
  Thunderbolt,
  Check,
  ChartColumnStacked,
  Cup,
} from "@gravity-ui/icons";

import SummaryCard from "@/app/components/history/summary-card";

interface FullTestHistorySummaryProps {
  totalTests?: number;
  completedTests?: number;
  averageAccuracy?: number;
  averageScaledScore?: number | null;
  history?: any[];
}

/* ── Helper: đọc field correct / answered từ nhiều nguồn ── */
const getCorrect = (x: any): number => {
  const direct = Math.max(
    Number(x?.totalCorrect ?? 0),
    Number(x?.correct ?? 0),
    Number(x?.correctAnswers ?? 0),
  );
  if (direct > 0) return direct;

  const sections = Array.isArray(x?.sections) ? x.sections : [];
  if (sections.length > 0) {
    return sections.reduce(
      (sum: number, s: any) =>
        sum + Number(s?.correct ?? s?.correctAnswers ?? 0),
      0,
    );
  }
  return 0;
};

const getWrong = (x: any): number => {
  const direct = Math.max(
    Number(x?.totalWrong ?? 0),
    Number(x?.incorrect ?? 0),
  );
  if (direct > 0) return direct;

  const sections = Array.isArray(x?.sections) ? x.sections : [];
  if (sections.length > 0) {
    return sections.reduce(
      (sum: number, s: any) =>
        sum + Number(s?.wrong ?? s?.incorrect ?? 0),
      0,
    );
  }
  return 0;
};

const getAnswered = (x: any): number => {
  const direct = Math.max(
    Number(x?.answeredQuestions ?? 0),
    Number(x?.answered ?? 0),
  );
  if (direct > 0) return direct;

  const sections = Array.isArray(x?.sections) ? x.sections : [];
  if (sections.length > 0) {
    const fromSections = sections.reduce((sum: number, s: any) => {
      const secAnswered = Number(s?.answered ?? 0);
      if (secAnswered > 0) return sum + secAnswered;
      return (
        sum +
        Number(s?.correct ?? 0) +
        Number(s?.wrong ?? s?.incorrect ?? 0)
      );
    }, 0);
    if (fromSections > 0) return fromSections;
  }

  return getCorrect(x) + getWrong(x);
};

const getScaled = (x: any): number | null => {
  const s = x?.scaledScore ?? x?.score;
  return typeof s === "number" && Number.isFinite(s) && s > 0 ? s : null;
};

/* ── FIX: accuracy của từng session (percent) ── */
const getSessionAccuracy = (x: any): number | null => {
  const answered = getAnswered(x);
  if (answered <= 0) return null;
  const correct = getCorrect(x);
  return (correct / answered) * 100;
};

export default function FullTestHistorySummary({
  totalTests: totalTestsProp,
  completedTests: completedTestsProp,
  averageAccuracy: averageAccuracyProp,
  averageScaledScore: averageScaledScoreProp,
  history,
}: FullTestHistorySummaryProps) {
  let totalTests: number;
  let completedTests: number;
  let averageAccuracy: number;
  let averageScaledScore: number | null;

  if (Array.isArray(history)) {
    console.log("[summary-debug] props", {
      historyProp: history,
      historyIsArray: Array.isArray(history),
      historyLen: Array.isArray(history) ? history.length : null,
      totalTestsProp,
      completedTestsProp,
      averageAccuracyProp,
      averageScaledScoreProp,
    });
    const completed = history.filter(
      (x) => String(x?.status ?? "").toUpperCase() === "COMPLETED",
    );

    /* ── NEW: mean of per-session accuracies ── */
    const perSessionAccuracies = completed
      .map((x) => getSessionAccuracy(x))
      .filter((v): v is number => v !== null);

    averageAccuracy =
      perSessionAccuracies.length > 0
        ? Math.round(
          perSessionAccuracies.reduce((sum, v) => sum + v, 0) /
          perSessionAccuracies.length,
        )
        : 0;

    /* Avg score — trung bình cộng scaledScore */
    const scoredTests = completed.filter((x) => getScaled(x) !== null);
    averageScaledScore =
      scoredTests.length > 0
        ? Math.round(
          scoredTests.reduce((sum, x) => sum + (getScaled(x) ?? 0), 0) /
          scoredTests.length,
        )
        : null;

    totalTests = history.length;
    completedTests = completed.length;
  } else {
    /* Fallback — dùng props như cũ */
    totalTests = Number(totalTestsProp ?? 0);
    completedTests = Number(completedTestsProp ?? 0);
    averageAccuracy = Number(averageAccuracyProp ?? 0);
    averageScaledScore =
      typeof averageScaledScoreProp === "number" &&
        Number.isFinite(averageScaledScoreProp) &&
        averageScaledScoreProp > 0
        ? averageScaledScoreProp
        : null;
  }

  /* Sanitize lần cuối */
  const safeTotal = Number.isFinite(totalTests) ? totalTests : 0;
  const safeCompleted = Number.isFinite(completedTests) ? completedTests : 0;
  const safeAccuracy = Number.isFinite(averageAccuracy)
    ? Math.max(0, Math.min(100, Math.round(averageAccuracy)))
    : 0;
  const safeAvgScore =
    averageScaledScore !== null && Number.isFinite(averageScaledScore)
      ? Math.round(averageScaledScore)
      : null;

  const cardContent = [
    {
      icon: <Thunderbolt width={20} />,
      label: "Full Tests",
      value: safeTotal,
      description: "Total sessions",
      iconClass: "bg-primary/10 text-primary",
    },
    {
      icon: <Check width={20} />,
      label: "Completed",
      value: safeCompleted,
      description: "Finished sessions",
      iconClass: "bg-success/10 text-success",
    },
    {
      icon: <ChartColumnStacked width={20} />,
      label: "Accuracy",
      value: `${safeAccuracy}%`,
      description: "Average across sessions",
      iconClass: "bg-warning/10 text-warning",
    },
    {
      icon: <Cup width={20} />,
      label: "Avg. Score",
      value: safeAvgScore !== null ? safeAvgScore : "N/A",
      description: "Scaled score (400–1600)",
      iconClass: "bg-secondary/10 text-secondary",
    },
  ];

  return (
    <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cardContent.map((item, index) => (
        <SummaryCard
          key={index}
          icon={item.icon}
          label={item.label}
          value={item.value}
          description={item.description}
          iconClass={item.iconClass}
        />
      ))}
    </section>
  );
}