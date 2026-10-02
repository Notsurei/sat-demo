"use client";

import { Button, Chip, Card } from "@heroui/react";
import {
  Thunderbolt,
  Calendar,
  CircleCheck,
  Clock,
  ArrowRight,
  Cup,
} from "@gravity-ui/icons";

interface FullTest {
  id: string;
  examId: string;
  examTitle: string;
  status: "IN_PROGRESS" | "BREAK" | "COMPLETED" | "EXPIRED";
  currentSectionOrder: number;
  totalSections: number;
  totalQuestions: number;
  totalCorrect: number;
  totalWrong: number;
  totalSkipped: number;
  rawScore?: number | null;
  scaledScore?: number | null;
  totalTimeSpent?: number | null;
  startedAt: string;
  completedAt?: string | null;
}

interface FullTestHistoryCardProps {
  test: FullTest;
  onAction?: (test: FullTest) => void;
}

export default function FullTestHistoryCard({
  test,
  onAction,
}: FullTestHistoryCardProps) {
  const accuracy =
    test.totalQuestions > 0
      ? Math.round((test.totalCorrect / test.totalQuestions) * 100)
      : 0;

  const isCompleted = test.status === "COMPLETED";
  const isInProgress =
    test.status === "IN_PROGRESS" || test.status === "BREAK";
  const isExpired = test.status === "EXPIRED";

  const date = new Date(test.startedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const getStatusLabel = () => {
    switch (test.status) {
      case "COMPLETED":
        return "Completed";
      case "IN_PROGRESS":
        return "In Progress";
      case "BREAK":
        return "On Break";
      case "EXPIRED":
        return "Expired";
      default:
        return test.status;
    }
  };

  const getStatusColor = (): "success" | "warning" | "danger" | "default" => {
    switch (test.status) {
      case "COMPLETED":
        return "success";
      case "IN_PROGRESS":
      case "BREAK":
        return "warning";
      case "EXPIRED":
        return "danger";
      default:
        return "default";
    }
  };

  const progressPercent = isCompleted
    ? 100
    : Math.round((test.currentSectionOrder / test.totalSections) * 100);

  return (
    <Card className="border border-default-200 bg-background shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <Card.Content className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                isInProgress
                  ? "bg-warning/10 text-warning"
                  : isExpired
                    ? "bg-danger/10 text-danger"
                    : "bg-primary/10 text-primary"
              }`}
            >
              <Thunderbolt width={20} />
            </div>

            <div className="min-w-0">
              <h3 className="truncate font-semibold text-foreground">
                {test.examTitle}
              </h3>

              <p className="truncate text-xs text-default-400">
                Full Test • {test.totalSections} sections
              </p>
            </div>
          </div>

          <Chip
            size="sm"
            color={getStatusColor()}
            variant="primary"
            className="shrink-0 font-semibold"
          >
            {getStatusLabel()}
          </Chip>
        </div>

        {/* Stats */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-default-50 p-3 dark:bg-default-800/50">
            <p className="text-xs font-medium text-default-400">
              Scaled Score
            </p>

            <p className="mt-1 text-lg font-bold text-foreground">
              {isCompleted ? (test.scaledScore ?? "--") : "--"}
            </p>
          </div>

          <div className="rounded-xl bg-default-50 p-3 dark:bg-default-800/50">
            <p className="text-xs font-medium text-default-400">Accuracy</p>

            <p className="mt-1 text-lg font-bold text-foreground">
              {accuracy}%
            </p>
          </div>

          <div className="rounded-xl bg-default-50 p-3 dark:bg-default-800/50">
            <p className="text-xs font-medium text-default-400">Correct</p>

            <p className="mt-1 text-lg font-bold text-foreground">
              {test.totalCorrect}/{test.totalQuestions}
            </p>
          </div>
        </div>

        {/* Progress bar (chỉ hiện khi chưa xong) */}
        {!isCompleted && !isExpired && (
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-xs text-default-500">
              <span>
                Section {test.currentSectionOrder}/{test.totalSections}
              </span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-default-100 dark:bg-default-700">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Meta */}
        <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-default-400">
          <span className="flex items-center gap-1.5">
            <Calendar width={14} />
            {date}
          </span>

          {isCompleted && (
            <span className="flex items-center gap-1.5">
              <CircleCheck width={14} />
              {test.totalCorrect} correct
            </span>
          )}

          {test.totalTimeSpent !== null &&
            test.totalTimeSpent !== undefined && (
              <span className="flex items-center gap-1.5">
                <Clock width={14} />
                {Math.round(test.totalTimeSpent / 60)} min
              </span>
            )}

          {isCompleted && test.scaledScore && (
            <span className="flex items-center gap-1.5">
              <Cup width={14} />
              {test.scaledScore}
            </span>
          )}
        </div>

        {/* Action */}
        <div className="mt-5 border-t border-default-200 pt-4 dark:border-default-700">
          {isInProgress ? (
            <Button
              size="sm"
              variant="primary"
              className="w-full font-semibold"
              onPress={() => onAction?.(test)}
            >
              Continue Test
              <ArrowRight width={15} />
            </Button>
          ) : (
            <Button
              size="sm"
              variant="primary"
              className="w-full font-semibold"
              onPress={() => onAction?.(test)}
              isDisabled={!isCompleted}
            >
              View Report
              {isCompleted && <ArrowRight width={15} />}
            </Button>
          )}
        </div>
      </Card.Content>
    </Card>
  );
}