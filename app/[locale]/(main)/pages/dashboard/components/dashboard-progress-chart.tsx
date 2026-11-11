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

import { TestHistory } from "@/app/components/history/type";

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

interface ModuleTestHistory {
  id: string;
  status: string;
  scaledScore?: number | null;
  rawScore?: number | null;
  totalQuestions?: number | null;
  startedAt: string;
  completedAt?: string | null;
}

interface DashboardProgressChartProps {
  practiceHistory: PracticeHistory[];
  fullTestHistory: TestHistory[];
  mathTestHistory?: ModuleTestHistory[];
  rwTestHistory?: ModuleTestHistory[];
}

interface ChartData {
  date: number;
  label: string;
  // Percentages (0-100) dùng để VẼ
  practicePct: number | null;
  fullTestPct: number | null;
  mathModulePct: number | null;
  rwModulePct: number | null;
  // Điểm gốc dùng cho Tooltip
  practiceScore: number | null;
  fullTestScore: number | null;
  mathModuleScore: number | null;
  rwModuleScore: number | null;
}

const COLORS = {
  practice: "#ef4444",
  fullTest: "#eab308",
  mathModule: "#3b82f6",
  rwModule: "#8b5cf6",
} as const;

const FULL_TEST_MAX = 1600;
const MODULE_MAX = 800;

const clampPct = (v: number) => Math.min(100, Math.max(0, v));

const getValidTimestamp = (
  completedAt?: string | null,
  startedAt?: string | null,
): number | null => {
  const value = completedAt || startedAt;
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
};

const computePracticeScore = (item: PracticeHistory): number | null => {
  if (typeof item.score === "number" && Number.isFinite(item.score)) {
    return item.score;
  }
  if (
    !Number.isFinite(item.totalQuestions) ||
    item.totalQuestions <= 0 ||
    !Number.isFinite(item.correctAnswers)
  ) {
    return null;
  }
  return Number(((item.correctAnswers / item.totalQuestions) * 100).toFixed(1));
};

const computeFullTestScaledScore = (item: TestHistory): number | null => {
  if (typeof item.scaledScore === "number" && Number.isFinite(item.scaledScore)) {
    return item.scaledScore;
  }
  if (
    typeof item.mathScore === "number" &&
    Number.isFinite(item.mathScore) &&
    typeof item.readingWritingScore === "number" &&
    Number.isFinite(item.readingWritingScore)
  ) {
    return item.mathScore + item.readingWritingScore;
  }
  return null;
};

const computeModuleScaled = (item: ModuleTestHistory): number | null => {
  if (typeof item.scaledScore === "number" && Number.isFinite(item.scaledScore)) {
    return item.scaledScore;
  }
  return null;
};

export default function DashboardProgressChart({
  practiceHistory,
  fullTestHistory,
  mathTestHistory = [],
  rwTestHistory = [],
}: DashboardProgressChartProps) {
  const t = useTranslations("dashboard.progressChart");
  const locale = useLocale();

  React.useEffect(() => {
    console.log("[chart-input]", {
      practiceLen: practiceHistory?.length ?? 0,
      fullTestLen: fullTestHistory?.length ?? 0,
      mathLen: mathTestHistory?.length ?? 0,
      rwLen: rwTestHistory?.length ?? 0,
    });
  }, [practiceHistory, fullTestHistory, mathTestHistory, rwTestHistory]);

  const data = React.useMemo<ChartData[]>(() => {
    const safePractice = Array.isArray(practiceHistory) ? practiceHistory : [];
    const safeFullTest = Array.isArray(fullTestHistory) ? fullTestHistory : [];
    const safeMath = Array.isArray(mathTestHistory) ? mathTestHistory : [];
    const safeRw = Array.isArray(rwTestHistory) ? rwTestHistory : [];

    const formatDate = (timestamp: number) =>
      new Date(timestamp).toLocaleDateString(locale, {
        month: "short",
        day: "numeric",
      });

    // 1. PRACTICE
    const practiceData: ChartData[] = safePractice.flatMap((item) => {
      const status = String(item.status ?? "").toUpperCase();
      if (status !== "COMPLETED") return [];

      const timestamp = getValidTimestamp(item.completedAt, item.startedAt);
      const score = computePracticeScore(item);
      if (timestamp === null || score === null) return [];

      return [{
        date: timestamp,
        label: formatDate(timestamp),
        practicePct: clampPct(score),
        fullTestPct: null,
        mathModulePct: null,
        rwModulePct: null,
        practiceScore: score,
        fullTestScore: null,
        mathModuleScore: null,
        rwModuleScore: null,
      }];
    });

    // 2. FULL TEST
    const fullTestData: ChartData[] = safeFullTest.flatMap((item) => {
      const status = String(item.status ?? "").toUpperCase();
      if (status !== "COMPLETED") return [];

      const timestamp = getValidTimestamp(item.completedAt, item.startedAt);
      const score = computeFullTestScaledScore(item);
      if (timestamp === null || score === null) return [];

      return [{
        date: timestamp,
        label: formatDate(timestamp),
        practicePct: null,
        fullTestPct: clampPct((score / FULL_TEST_MAX) * 100),
        mathModulePct: null,
        rwModulePct: null,
        practiceScore: null,
        fullTestScore: score,
        mathModuleScore: null,
        rwModuleScore: null,
      }];
    });

    // 3. MATH MODULE
    const mathData: ChartData[] = safeMath.flatMap((item) => {
      const status = String(item.status ?? "").toUpperCase();
      if (status !== "COMPLETED") return [];

      const timestamp = getValidTimestamp(item.completedAt, item.startedAt);
      const score = computeModuleScaled(item);
      if (timestamp === null || score === null) return [];

      return [{
        date: timestamp,
        label: formatDate(timestamp),
        practicePct: null,
        fullTestPct: null,
        mathModulePct: clampPct((score / MODULE_MAX) * 100),
        rwModulePct: null,
        practiceScore: null,
        fullTestScore: null,
        mathModuleScore: score,
        rwModuleScore: null,
      }];
    });

    // 4. RW MODULE
    const rwData: ChartData[] = safeRw.flatMap((item) => {
      const status = String(item.status ?? "").toUpperCase();
      if (status !== "COMPLETED") return [];

      const timestamp = getValidTimestamp(item.completedAt, item.startedAt);
      const score = computeModuleScaled(item);
      if (timestamp === null || score === null) return [];

      return [{
        date: timestamp,
        label: formatDate(timestamp),
        practicePct: null,
        fullTestPct: null,
        mathModulePct: null,
        rwModulePct: clampPct((score / MODULE_MAX) * 100),
        practiceScore: null,
        fullTestScore: null,
        mathModuleScore: null,
        rwModuleScore: score,
      }];
    });

    return [...practiceData, ...fullTestData, ...mathData, ...rwData]
      .sort((a, b) => a.date - b.date);
  }, [practiceHistory, fullTestHistory, mathTestHistory, rwTestHistory, locale]);

  const hasPractice = data.some((d) => d.practicePct !== null);
  const hasFullTest = data.some((d) => d.fullTestPct !== null);
  const hasMathModule = data.some((d) => d.mathModulePct !== null);
  const hasRwModule = data.some((d) => d.rwModulePct !== null);

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
                margin={{ top: 10, right: 55, left: 0, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  className="stroke-default-200"
                />

                <XAxis
                  dataKey="date"
                  type="number"
                  scale="time"
                  domain={["dataMin", "dataMax"]}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) =>
                    new Date(Number(value)).toLocaleDateString(locale, {
                      month: "short",
                      day: "numeric",
                    })
                  }
                  minTickGap={30}
                  tickMargin={8}
                  padding={{ left: 20, right: 20 }}
                />

                {/* ✅ 1 trục phải duy nhất — thang % (0-100) */}
                <YAxis
                  yAxisId="pct"
                  orientation="right"
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  tickFormatter={(value) => `${value}%`}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                  width={50}
                />

                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) {
                      return null;
                    }

                    const row = payload[0]?.payload as ChartData | undefined;
                    if (!row) return null;

                    const hasPracticeValue = row.practiceScore !== null;
                    const hasFullTestValue = row.fullTestScore !== null;
                    const hasMathValue = row.mathModuleScore !== null;
                    const hasRwValue = row.rwModuleScore !== null;

                    return (
                      <div className="rounded-xl border border-default-200 bg-background px-4 py-3 shadow-lg">
                        <p className="mb-2 text-xs font-semibold text-default-500">
                          {new Date(row.date).toLocaleDateString(locale, {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>

                        {hasPracticeValue && (
                          <p
                            className="text-sm font-medium"
                            style={{ color: COLORS.practice }}
                          >
                            {t("practice")}:{" "}
                            <span className="font-bold">
                              {row.practiceScore}%
                            </span>
                          </p>
                        )}

                        {hasFullTestValue && (
                          <p
                            className="text-sm font-medium"
                            style={{ color: COLORS.fullTest }}
                          >
                            {t("fullTest")}:{" "}
                            <span className="font-bold">
                              {row.fullTestScore}
                            </span>
                            <span className="text-xs text-default-400">
                              {" "}/ 1600 (
                              {row.fullTestPct?.toFixed(1)}%)
                            </span>
                          </p>
                        )}

                        {hasMathValue && (
                          <p
                            className="text-sm font-medium"
                            style={{ color: COLORS.mathModule }}
                          >
                            {t("mathModule")}:{" "}
                            <span className="font-bold">
                              {row.mathModuleScore}
                            </span>
                            <span className="text-xs text-default-400">
                              {" "}/ 800 (
                              {row.mathModulePct?.toFixed(1)}%)
                            </span>
                          </p>
                        )}

                        {hasRwValue && (
                          <p
                            className="text-sm font-medium"
                            style={{ color: COLORS.rwModule }}
                          >
                            {t("rwModule")}:{" "}
                            <span className="font-bold">
                              {row.rwModuleScore}
                            </span>
                            <span className="text-xs text-default-400">
                              {" "}/ 800 (
                              {row.rwModulePct?.toFixed(1)}%)
                            </span>
                          </p>
                        )}
                      </div>
                    );
                  }}
                />

                {hasPractice && (
                  <Line
                    yAxisId="pct"
                    type="monotone"
                    dataKey="practicePct"
                    name={t("practice")}
                    stroke={COLORS.practice}
                    strokeWidth={3}
                    dot={{ r: 4, fill: COLORS.practice }}
                    activeDot={{ r: 6, fill: COLORS.practice }}
                    connectNulls={true}
                  />
                )}

                {hasFullTest && (
                  <Line
                    yAxisId="pct"
                    type="monotone"
                    dataKey="fullTestPct"
                    name={t("fullTest")}
                    stroke={COLORS.fullTest}
                    strokeWidth={3}
                    dot={{ r: 4, fill: COLORS.fullTest }}
                    activeDot={{ r: 6, fill: COLORS.fullTest }}
                    connectNulls={true}
                  />
                )}

                {hasMathModule && (
                  <Line
                    yAxisId="pct"
                    type="monotone"
                    dataKey="mathModulePct"
                    name={t("mathModule")}
                    stroke={COLORS.mathModule}
                    strokeWidth={3}
                    dot={{ r: 4, fill: COLORS.mathModule }}
                    activeDot={{ r: 6, fill: COLORS.mathModule }}
                    connectNulls={true}
                  />
                )}

                {hasRwModule && (
                  <Line
                    yAxisId="pct"
                    type="monotone"
                    dataKey="rwModulePct"
                    name={t("rwModule")}
                    stroke={COLORS.rwModule}
                    strokeWidth={3}
                    dot={{ r: 4, fill: COLORS.rwModule }}
                    activeDot={{ r: 6, fill: COLORS.rwModule }}
                    connectNulls={true}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* LEGEND giữ nguyên */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {hasPractice && (
            <div className="flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 dark:border-red-800 dark:bg-red-900/20">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS.practice }} />
              <span className="text-xs font-semibold text-red-600 dark:text-red-400">{t("practice")}</span>
            </div>
          )}
          {hasFullTest && (
            <div className="flex items-center gap-2 rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1.5 dark:border-yellow-800 dark:bg-yellow-900/20">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS.fullTest }} />
              <span className="text-xs font-semibold text-yellow-700 dark:text-yellow-400">{t("fullTest")}</span>
            </div>
          )}
          {hasMathModule && (
            <div className="flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 dark:border-blue-800 dark:bg-blue-900/20">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS.mathModule }} />
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">{t("mathModule")}</span>
            </div>
          )}
          {hasRwModule && (
            <div className="flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-3 py-1.5 dark:border-purple-800 dark:bg-purple-900/20">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS.rwModule }} />
              <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">{t("rwModule")}</span>
            </div>
          )}
        </div>
      </Card.Content>
    </Card>
  );
}