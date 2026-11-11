"use client";

import { Button, Chip, Card } from "@heroui/react";
import { useTranslations } from "next-intl";
import {
  ChartColumn,
  BookOpen,
  Calendar,
  CircleCheck,
  Clock,
  ArrowRight,
  Cup,
} from "@gravity-ui/icons";

import type { TestHistory } from "./type";
import {
  formatHistoryDate,
  formatHistoryTime,
  getHistoryAccuracy,
  getHistoryStatusColor,
  isHistoryCompleted,
  isHistoryInProgress,
  isHistoryExpired,
} from "./history-utils";

interface ModuleHistoryCardProps {
  test: TestHistory;
  subjectLabel: string;
  onAction?: (test: TestHistory) => void;
}

const STATUS_KEYS: Record<TestHistory["status"], string> = {
  COMPLETED: "completed",
  IN_PROGRESS: "inProgress",
  ABANDONED: "abandoned",
  EXPIRED: "expired",
};

export default function ModuleHistoryCard({
  test,
  subjectLabel,
  onAction,
}: ModuleHistoryCardProps) {
  const t = useTranslations("moduleReportCommon.card");

  const isMath = test.subject === "SAT_MATH";
  const completed = isHistoryCompleted(test.status);
  const inProgress = isHistoryInProgress(test.status);
  const expired = isHistoryExpired(test.status);

  const totalCorrect = test.totalCorrect ?? 0;
  const totalQuestions = test.totalQuestions ?? 0;
  const totalSections = test.totalSections ?? 0;
  const currentSectionOrder = test.currentSectionOrder ?? 1;

  const accuracy = getHistoryAccuracy(totalCorrect, totalQuestions);

  const progressPercent =
    completed || totalSections === 0
      ? 100
      : Math.round((currentSectionOrder / totalSections) * 100);

  const showProgress = !completed && !expired && totalSections > 0;

  const Icon = isMath ? ChartColumn : BookOpen;

  return (
    <Card className="border border-default-200 bg-background shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <Card.Content className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                inProgress
                  ? "bg-warning/10 text-warning"
                  : expired
                    ? "bg-danger/10 text-danger"
                    : isMath
                      ? "bg-orange-500/10 text-orange-500"
                      : "bg-red-500/10 text-red-500"
              }`}
            >
              <Icon width={20} />
            </div>

            <div className="min-w-0">
              <h3 className="truncate font-semibold leading-tight text-foreground">
                {test.examTitle}
              </h3>
              <p className="truncate text-xs leading-snug text-default-400">
                {t("metaLine", { subject: subjectLabel })}
              </p>
            </div>
          </div>

          <Chip
            size="sm"
            color={getHistoryStatusColor(test.status)}
            variant="primary"
            className="shrink-0 font-semibold"
          >
            {t(`statusLabels.${STATUS_KEYS[test.status]}`)}
          </Chip>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-default-50 p-3 dark:bg-default-800/50">
            <p className="text-xs font-medium leading-snug text-default-400">
              {t("scaledScoreLabel")}
            </p>
            <p className="mt-1 text-lg font-bold leading-tight text-foreground">
              {completed ? (test.scaledScore ?? "--") : "--"}
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
              {totalCorrect}/{totalQuestions}
            </p>
          </div>
        </div>

        {showProgress && (
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-xs text-default-500">
              <span>
                {t("sectionProgress", {
                  current: currentSectionOrder,
                  total: totalSections,
                })}
              </span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-default-100 dark:bg-default-700">
              <div
                className={`h-full transition-all ${
                  isMath ? "bg-orange-500" : "bg-red-500"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-default-400">
          <span className="flex items-center gap-1.5">
            <Calendar width={14} />
            {formatHistoryDate(test.startedAt)}
          </span>

          {completed && (
            <span className="flex items-center gap-1.5">
              <CircleCheck width={14} />
              {t("correctCount", { count: totalCorrect })}
            </span>
          )}

          {test.totalTimeSpent != null && test.totalTimeSpent > 0 && (
            <span className="flex items-center gap-1.5">
              <Clock width={14} />
              {formatHistoryTime(test.totalTimeSpent)}
            </span>
          )}

          {completed && test.scaledScore != null && (
            <span className="flex items-center gap-1.5">
              <Cup width={14} />
              {test.scaledScore}
            </span>
          )}
        </div>

        <div className="mt-5 border-t border-default-200 pt-4 dark:border-default-700">
          {inProgress ? (
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
              isDisabled={!completed}
            >
              {t("buttons.viewReport")}
              {completed && <ArrowRight width={15} />}
            </Button>
          )}
        </div>
      </Card.Content>
    </Card>
  );
}
