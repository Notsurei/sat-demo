"use client";

import React from "react";
import { useRouter } from "next/navigation";

import { Button, Card, Chip } from "@heroui/react";

import {
  ArrowRight,
  BookOpen,
  Calendar,
  Check,
  Clock,
} from "@gravity-ui/icons";

import TestModeModal from "../modal-button/test-mode-modal";

import type { FullTestHistory } from "@/app/(main)/pages/full-test-report-history/components/type";

interface RecentFullTestHistoryProps {
  history: FullTestHistory[];
  loading?: boolean;
}

export default function RecentFullTestHistory({
  history,
  loading = false,
}: RecentFullTestHistoryProps) {
  const router = useRouter();

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "Unknown date";

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));
  };

  const formatTime = (seconds: number) => {
    if (!seconds || seconds <= 0) return "0m";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }

    return `${minutes}m`;
  };

  const getStatusName = (status: FullTestHistory["status"]) => {
    switch (status) {
      case "COMPLETED":
        return "Completed";

      case "IN_PROGRESS":
        return "In Progress";

      case "ABANDONED":
        return "Abandoned";

      default:
        return status;
    }
  };

  const getStatusColor = (
    status: FullTestHistory["status"],
  ): "success" | "warning" | "danger" | "default" => {
    switch (status) {
      case "COMPLETED":
        return "success";

      case "IN_PROGRESS":
        return "warning";

      case "ABANDONED":
        return "danger";

      default:
        return "default";
    }
  };

  const handleTestClick = (test: FullTestHistory) => {
    if (test.status === "IN_PROGRESS") {
      router.push(`/full-test/${test.examId}/session/${test.id}`);
      return;
    }

    if (test.status === "COMPLETED") {
      router.push(`/pages/full-test-report/${test.id}`);
      return;
    }
  };

  return (
    <Card className="border border-default-200 bg-background shadow-sm">
      <Card.Header className="flex items-center justify-between border-b border-default-200 px-6 py-5">
        <div>
          <h2 className="text-lg font-semibold">
            Recent Full Test History
          </h2>

          <p className="mt-1 text-sm text-default-500">
            Your 5 most recent full tests
          </p>
        </div>

        <Button
          size="sm"
          variant="ghost"
          onPress={() => router.push("/pages/full-test-report-history")}
        >
          View All
          <ArrowRight width={15} />
        </Button>
      </Card.Header>

      <Card.Content className="p-0">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <p className="text-sm text-default-400">
              Loading history...
            </p>
          </div>
        ) : history.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <BookOpen width={26} />
            </div>

            <h3 className="font-semibold">
              No full test history yet
            </h3>

            <p className="mt-1 max-w-sm text-sm text-default-500">
              Complete your first full SAT test and your results will
              appear here.
            </p>

            <div className="mt-5">
              <TestModeModal />
            </div>
          </div>
        ) : (
          <div className="divide-y divide-default-200">
            {history.slice(0, 5).map((test) => {
              const isCompleted = test.status === "COMPLETED";

              const accuracy =
                test.totalQuestions > 0
                  ? Math.round(
                      (test.correct / test.totalQuestions) * 100,
                    )
                  : 0;

              const totalTimeSpent = test.sections.reduce(
                (total, section) => {
                  if (!section.completedAt) {
                    return total;
                  }

                  return total;
                },
                0,
              );

              return (
                <button
                  key={test.id}
                  type="button"
                  onClick={() => handleTestClick(test)}
                  className="
                    group
                    flex w-full
                    items-center
                    px-4 py-4
                    text-left
                    transition-all duration-200
                    hover:bg-default-50
                    hover:shadow-sm
                    sm:px-5
                  "
                >
                  <div className="flex w-full items-center gap-4">
                    {/* Icon */}
                    <div
                      className="
                        flex h-11 w-11 shrink-0
                        items-center justify-center
                        rounded-xl
                        bg-primary/10 text-primary
                      "
                    >
                      {isCompleted ? (
                        <Check width={19} />
                      ) : (
                        <BookOpen width={19} />
                      )}
                    </div>

                    {/* Main info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-semibold text-foreground">
                          {test.examTitle}
                        </h3>

                        <Chip
                          size="sm"
                          variant="primary"
                          color={getStatusColor(test.status)}
                          className="h-6 px-2 text-xs"
                        >
                          {getStatusName(test.status)}
                        </Chip>
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-default-400">
                        <span className="flex items-center gap-1">
                          <Calendar width={12} />
                          {formatDate(test.startedAt)}
                        </span>

                        <span className="h-1 w-1 rounded-full bg-default-300" />

                        <span>
                          {test.correct}/{test.totalQuestions} correct
                        </span>

                        <span className="h-1 w-1 rounded-full bg-default-300" />

                        <span>
                          {test.totalQuestions -
                            test.answeredQuestions}{" "}
                          unanswered
                        </span>

                        {totalTimeSpent > 0 && (
                          <>
                            <span className="h-1 w-1 rounded-full bg-default-300" />

                            <span className="flex items-center gap-1">
                              <Clock width={12} />
                              {formatTime(totalTimeSpent)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Score */}
                    <div className="hidden shrink-0 text-right sm:block">
                      {isCompleted ? (
                        <>
                          <p
                            className={`text-lg font-bold ${
                              accuracy >= 80
                                ? "text-success"
                                : accuracy >= 60
                                  ? "text-warning"
                                  : "text-danger"
                            }`}
                          >
                            {accuracy}%
                          </p>

                          <p className="text-[11px] text-default-400">
                            accuracy
                          </p>

                          {test.scaledScore !== null &&
                            test.scaledScore !== undefined && (
                              <p className="mt-0.5 text-xs font-semibold text-foreground">
                                {test.scaledScore} SAT
                              </p>
                            )}
                        </>
                      ) : (
                        <p className="text-sm font-semibold text-default-400">
                          —
                        </p>
                      )}
                    </div>

                    {/* Arrow */}
                    <div
                      className="
                        flex h-9 w-9 shrink-0
                        items-center justify-center
                        rounded-full
                        text-default-300
                        transition-all duration-200
                        group-hover:bg-primary/10
                        group-hover:text-primary
                      "
                    >
                      <ArrowRight
                        width={17}
                        className="
                          transition-transform duration-200
                          group-hover:translate-x-0.5
                        "
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Card.Content>
    </Card>
  );
}