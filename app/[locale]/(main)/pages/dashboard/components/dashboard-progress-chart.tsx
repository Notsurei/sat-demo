"use client";

import React from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card } from "@heroui/react";
import { useLocale, useTranslations } from "next-intl";

import { FullTestHistory } from "../../full-test-report-history/components/type";
import { CircleFill } from "@gravity-ui/icons";

interface PracticeHistory {
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
  mode: string;
  status: string;
}

interface DashboardProgressChartProps {
  practiceHistory: PracticeHistory[];
  fullTestHistory: FullTestHistory[];
}

interface ChartData {
  date: number;
  label: string;
  practice: number | null;
  fullTest: number | null;
}

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
    const total = sections.reduce(
      (sum, s) => sum + (s.totalQuestions || 0),
      0,
    );
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

export default function DashboardProgressChart({
  practiceHistory,
  fullTestHistory,
}: DashboardProgressChartProps) {
  const t = useTranslations("dashboard.progressChart");
  const locale = useLocale();

  const data = React.useMemo<ChartData[]>(() => {
    const safePractice = Array.isArray(practiceHistory) ? practiceHistory : [];
    const safeFullTest = Array.isArray(fullTestHistory) ? fullTestHistory : [];

    const formatDate = (timestamp: number) =>
      new Date(timestamp).toLocaleDateString(locale, {
        month: "short",
        day: "numeric",
      });

    const practiceData: ChartData[] = safePractice
      .filter((item) => {
        const status = String(item.status ?? "").toUpperCase();
        if (status === "ABANDONED") return false;
        if (!item.totalQuestions || item.totalQuestions === 0) return false;
        return true;
      })
      .map((item) => {
        const score = computePracticeScore(item);
        if (score === null) return null;

        const timestamp = new Date(
          item.completedAt ?? item.startedAt,
        ).getTime();

        return {
          date: timestamp,
          label: formatDate(timestamp),
          practice: score,
          fullTest: null,
        } as ChartData;
      })
      .filter((d): d is ChartData => d !== null);

    const fullTestData: ChartData[] = safeFullTest
      .filter((item) => {
        const status = String(item.status ?? "").toUpperCase();
        return status === "COMPLETED" || status === "IN_PROGRESS";
      })
      .map((item) => {
        const scaled = computeFullTestScaledScore(item);
        if (scaled === null) return null;

        const timestamp = new Date(
          item.completedAt ?? item.startedAt,
        ).getTime();

        return {
          date: timestamp,
          label: formatDate(timestamp),
          practice: null,
          fullTest: scaled,
        } as ChartData;
      })
      .filter((d): d is ChartData => d !== null);

    return [...practiceData, ...fullTestData]
      .sort((a, b) => a.date - b.date)
      .slice(-10);
  }, [practiceHistory, fullTestHistory, locale]);

  return (
    <Card className="mb-8 border border-default-200 bg-background shadow-sm">
      <Card.Header className="border-b border-default-200 px-6 py-5">
        <div>
          <h2 className="text-lg font-semibold leading-tight">{t("title")}</h2>

          <p className="mt-1 text-sm leading-relaxed text-default-500">
            {t("subtitle")}
          </p>
        </div>
      </Card.Header>

      <Card.Content className="p-6">
        {data.length === 0 ? (
          <div className="flex h-72 items-center justify-center">
            <p className="text-sm leading-relaxed text-default-400">
              {t("empty")}
            </p>
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{
                  top: 10,
                  right: 20,
                  left: 0,
                  bottom: 5,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  className="stroke-default-200"
                />

                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                />

                <YAxis
                  domain={[0, 100]}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                  width={40}
                />

                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || payload.length === 0) {
                      return null;
                    }

                    const practice = payload.find(
                      (item) => item.dataKey === "practice",
                    );

                    const fullTest = payload.find(
                      (item) => item.dataKey === "fullTest",
                    );

                    return (
                      <div className="rounded-xl border border-default-200 bg-background px-4 py-3 shadow-lg">
                        <p className="mb-2 text-xs font-semibold text-default-500">
                          {label}
                        </p>

                        {practice?.value !== null &&
                          practice?.value !== undefined && (
                            <p className="text-sm font-medium text-primary">
                              {t("practice")}:{" "}
                              <span className="font-bold">
                                {practice.value}%
                              </span>
                            </p>
                          )}

                        {fullTest?.value !== null &&
                          fullTest?.value !== undefined && (
                            <p className="text-sm font-medium text-secondary">
                              {t("fullTest")}:{" "}
                              <span className="font-bold">
                                {fullTest.value}
                              </span>
                            </p>
                          )}
                      </div>
                    );
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="practice"
                  name={t("practice")}
                  stroke="#ef4444"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#ef4444" }}
                  activeDot={{ r: 6, fill: "#ef4444" }}
                  connectNulls={false}
                />

                <Line
                  type="monotone"
                  dataKey="fullTest"
                  name={t("fullTest")}
                  stroke="#eab308"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#eab308" }}
                  activeDot={{ r: 6, fill: "#eab308" }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="mt-5 flex items-center justify-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5">
            <span className="relative flex w-6 items-center">
              <CircleFill className="text-red-500" width={10} height={10} />
              <span className="absolute left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-primary ring-2 ring-background" />
            </span>

            <span className="text-xs font-semibold text-primary">
              {t("practice")}
            </span>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary/10 px-3 py-1.5">
            <span className="relative flex w-6 items-center">
              <CircleFill className="text-yellow-400" width={10} height={10} />
              <span className="absolute left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-secondary ring-2 ring-background" />
            </span>

            <span className="text-xs font-semibold text-secondary">
              {t("fullTest")}
            </span>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}