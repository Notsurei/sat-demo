"use client";

import React from "react";
import { Card } from "@heroui/react";

import {
  TargetDart,
  ChartColumnStacked,
  PencilToLine,
  Thunderbolt,
} from "@gravity-ui/icons";

import { PracticeHistory } from "../hooks/use-dashboard-data";

interface DashboardStatsProps {
  history: PracticeHistory[];
}

export default function DashboardStats({
  history,
}: DashboardStatsProps) {
  const stats = React.useMemo(() => {
    const completedPractices = history.filter(
      (practice) => practice.status === "DONE",
    );

    const latestPractice = completedPractices[0];

    const totalCorrect = completedPractices.reduce(
      (total, practice) => total + (practice.correctAnswers || 0),
      0,
    );

    const totalQuestions = completedPractices.reduce(
      (total, practice) => total + (practice.totalQuestions || 0),
      0,
    );

    const accuracy =
      totalQuestions > 0
        ? Math.round((totalCorrect / totalQuestions) * 100)
        : 0;

    const currentScore =
      latestPractice?.score !== null &&
      latestPractice?.score !== undefined
        ? latestPractice.score
        : "--";

    return [
      {
        label: "Current Score",
        value: currentScore,
        trend: latestPractice
          ? "Latest practice"
          : "No completed tests",
        icon: <TargetDart className="h-6 w-6" />,
        iconClass: "bg-danger/10 text-danger",
      },
      {
        label: "Accuracy",
        value: `${accuracy}%`,
        trend:
          totalQuestions > 0
            ? `${totalCorrect}/${totalQuestions} correct`
            : "No data yet",
        icon: <ChartColumnStacked className="h-6 w-6" />,
        iconClass: "bg-success/10 text-success",
      },
      {
        label: "Practice Sessions",
        value: history.length,
        trend:
          history.length > 0
            ? `${completedPractices.length} completed`
            : "No sessions yet",
        icon: <PencilToLine className="h-6 w-6" />,
        iconClass: "bg-primary/10 text-primary",
      },
      {
        label: "Study Streak",
        value: "Coming soon",
        trend: "Keep practicing!",
        icon: <Thunderbolt className="h-6 w-6" />,
        iconClass: "bg-warning/10 text-warning",
      },
    ];
  }, [history]);

  return (
    <section className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card
          key={stat.label}
          className="border border-default-200 bg-background shadow-sm"
        >
          <Card.Content className="p-5">
            <div className="flex items-start justify-between">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.iconClass}`}
              >
                {stat.icon}
              </div>

              <span className="text-xs text-default-400">
                {stat.trend}
              </span>
            </div>

            <p className="mt-5 text-2xl font-bold">{stat.value}</p>

            <p className="mt-1 text-sm text-default-500">
              {stat.label}
            </p>
          </Card.Content>
        </Card>
      ))}
    </section>
  );
}

