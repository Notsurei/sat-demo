"use client";

import { Button, Chip, Card } from "@heroui/react";
import { useLocale, useTranslations } from "next-intl";
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

type StatusKey = "completed" | "inProgress" | "break" | "expired";

const STATUS_MAP: Record<
  string,
  { key: StatusKey; color: "success" | "warning" | "danger" | "default" }
> = {
  COMPLETED: { key: "completed", color: "success" },
  IN_PROGRESS: { key: "inProgress", color: "warning" },
  BREAK: { key: "break", color: "warning" },
  EXPIRED: { key: "expired", color: "danger" },
};

export default function FullTestHistoryCard({
  test,
  onAction,
}: FullTestHistoryCardProps) {
  const t = useTranslations("fullTestReport.history.card");
  const locale = useLocale();

  const accuracy =
    test.totalQuestions > 0
      ? Math.round((test.totalCorrect / test.totalQuestions) * 100)
      : 0;

  const isCompleted = test.status === "COMPLETED";
  const isInProgress =
    test.status === "IN_PROGRESS" || test.status === "BREAK";
  const isExpired = test.status === "EXPIRED";

  const statusMeta =
    STATUS_MAP[test.status] ?? {
      key: "expired" as const,
      color: "default" as const,
    };

  const statusLabel = t(`statusLabels.${statusMeta.key}`);

  const date = new Date(test.startedAt).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const progressPercent = isCompleted
    ? 100
    : Math.round((test.currentSectionOrder / test.totalSections) * 100);

  return (
    <Card className="border border-default-200 bg-background shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <Card.Content className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${isInProgress
                  ? "bg-warning/10 text-warning"
                  : isExpired
                    ? "bg-danger/10 text-danger"
                    : "bg-primary/10 text-primary"
                }`}
            >
              <Thunderbolt width={20} />
            </div>

            <div className="min-w-0">
              <h3 className="truncate font-semibold leading-tight text-foreground">
                {test.examTitle}
              </h3>

              <p className="truncate text-xs leading-snug text-default-400">
                {t("metaLine", { count: test.totalSections })}
              </p>
            </div>
          </div>

          <Chip
            size="sm"
            color={statusMeta.color}
            variant="primary"
            className="shrink-0 font-semibold"
          >
            {statusLabel}
          </Chip>
        </div>

        {/* Stats */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-default-50 p-3 dark:bg-default-800/50">
            <p className="text-xs font-medium leading-snug text-default-400">
              {t("scaledScoreLabel")}
            </p>

            <p className="mt-1 text-lg font-bold leading-tight text-foreground">
              {isCompleted ? (test.scaledScore ?? "--") : "--"}
            </p>
          </div>

          <div className="rounded-xl bg-default-50 p-3 dark:bg-default-800/50">
            <p className="text-xs font-medium leading-snug text-default-400">
              {t("accuracyLabel")}
            </p>

            <p className="mt-1 text-lg font-bold leading-tight text-foreground">
              {accuracy}%
            </p>
          </div>

          <div className="rounded-xl bg-default-50 p-3 dark:bg-default-800/50">
            <p className="text-xs font-medium leading-snug text-default-400">
              {t("correctLabel")}
            </p>

            <p className="mt-1 text-lg font-bold leading-tight text-foreground">
              {test.totalCorrect}/{test.totalQuestions}
            </p>
          </div>
        </div>

        {/* Progress bar (chỉ hiện khi chưa xong) */}
        {!isCompleted && !isExpired && (
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-xs text-default-500">
              <span>
                {t("sectionProgress", {
                  current: test.currentSectionOrder,
                  total: test.totalSections,
                })}
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
              {t("correctCount", { count: test.totalCorrect })}
            </span>
          )}

          {test.totalTimeSpent !== null &&
            test.totalTimeSpent !== undefined && (
              <span className="flex items-center gap-1.5">
                <Clock width={14} />
                {t("minutesLabel", {
                  count: Math.round(test.totalTimeSpent / 60),
                })}
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
              {t("buttons.continue")}
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
              {t("buttons.viewReport")}
              {isCompleted && <ArrowRight width={15} />}
            </Button>
          )}
        </div>
      </Card.Content>
    </Card>
  );
}