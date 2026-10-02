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

export default function DashboardProgressChart({
  practiceHistory,
  fullTestHistory,
}: DashboardProgressChartProps) {
  const data = React.useMemo<ChartData[]>(() => {
    const practiceData: ChartData[] = practiceHistory
      .filter(
        (item) =>
          item.status === "DONE" &&
          item.score !== null &&
          item.score !== undefined,
      )
      .map((item) => {
        const timestamp = new Date(
          item.completedAt ?? item.startedAt,
        ).getTime();

        return {
          date: timestamp,
          label: new Date(timestamp).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          practice: item.score ?? 0,
          fullTest: null,
        };
      });

    const fullTestData: ChartData[] = fullTestHistory
      .filter(
        (item) =>
          item.status === "COMPLETED" &&
          item.scaledScore !== null &&
          item.scaledScore !== undefined,
      )
      .map((item) => {
        const timestamp = new Date(
          item.completedAt ?? item.startedAt,
        ).getTime();

        return {
          date: timestamp,
          label: new Date(timestamp).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          practice: null,
          fullTest: item.scaledScore ?? 0,
        };
      });

    return [...practiceData, ...fullTestData]
      .sort((a, b) => a.date - b.date)
      .slice(-10);
  }, [practiceHistory, fullTestHistory]);

  return (
    <Card className="mb-8 border border-default-200 bg-background shadow-sm">
      <Card.Header className="border-b border-default-200 px-6 py-5">
        <div>
          <h2 className="text-lg font-semibold">Progress Overview</h2>

          <p className="mt-1 text-sm text-default-500">
            Your recent Practice and Full Test performance.
          </p>
        </div>
      </Card.Header>

      <Card.Content className="p-6">
        {data.length === 0 ? (
          <div className="flex h-72 items-center justify-center">
            <p className="text-sm text-default-400">
              Complete a Practice or Full Test to see your progress.
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
                              Practice:{" "}
                              <span className="font-bold">
                                {practice.value}%
                              </span>
                            </p>
                          )}

                        {fullTest?.value !== null &&
                          fullTest?.value !== undefined && (
                            <p className="text-sm font-medium text-secondary">
                              Full Test:{" "}
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
                  name="Practice"
                  stroke="#ef4444"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    fill: "#ef4444",
                  }}
                  activeDot={{
                    r: 6,
                    fill: "#ef4444",
                  }}
                  connectNulls={false}
                />

                <Line
                  type="monotone"
                  dataKey="fullTest"
                  name="Full Test"
                  stroke="#eab308"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    fill: "#eab308",
                  }}
                  activeDot={{
                    r: 6,
                    fill: "#eab308",
                  }}
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

            <span className="text-xs font-semibold text-primary">Practice</span>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary/10 px-3 py-1.5">
            <span className="relative flex w-6 items-center">
              <CircleFill className="text-yellow-400" width={10} height={10} />
              <span className="absolute left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-secondary ring-2 ring-background" />
            </span>

            <span className="text-xs font-semibold text-secondary">
              Full Test
            </span>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}
