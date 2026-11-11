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

/* Mở rộng để accept cả 2 shape: mapped (totalCorrect) hoặc raw API (correct) */
interface FullTest {
  id: string;
  examId: string;
  examTitle?: string;
  exam?: { title?: string };
  status: "IN_PROGRESS" | "BREAK" | "COMPLETED" | "EXPIRED";
  currentSectionOrder?: number;
  totalSections?: number;
  sections?: unknown[];

  totalQuestions?: number;
  totalCorrect?: number;
  correct?: number;
  totalWrong?: number;
  incorrect?: number;
  totalSkipped?: number;
  unanswered?: number;
  answered?: number;
  answeredQuestions?: number;

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

  /* ── FIX: đọc cả 2 shape (mapped + raw API) ── */
  const safeCorrect = Number(test.totalCorrect ?? test.correct ?? 0);
  const safeWrong = Number(test.totalWrong ?? test.incorrect ?? 0);
  const safeSkipped = Number(test.totalSkipped ?? test.unanswered ?? 0);

  const safeAnswered = Number(
    test.answeredQuestions ??
    test.answered ??
    safeCorrect + safeWrong,
  );

  const safeTotal = Number(
    test.totalQuestions ??
    (safeCorrect + safeWrong + safeSkipped),
  );

  const examTitle =
    test.examTitle ?? test.exam?.title ?? "Full Test";

  const totalSections =
    test.totalSections ??
    (Array.isArray(test.sections) ? test.sections.length : 0);

  const currentSectionOrder = test.currentSectionOrder ?? 0;

  const hasData = safeAnswered > 0;

  /* accuracy = correct / answered — đúng SAT */
  const accuracy = hasData
    ? Math.round((safeCorrect / safeAnswered) * 100)
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
    : totalSections > 0
      ? Math.round((currentSectionOrder / totalSections) * 100)
      : 0;

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
                {examTitle}
              </h3>
              <p className="truncate text-xs leading-snug text-default-400">
                {t("metaLine", { count: totalSections })}
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
              {isCompleted && typeof test.scaledScore === "number"
                ? test.scaledScore
                : "--"}
            </p>
          </div>

          <div className="rounded-xl bg-default-50 p-3 dark:bg-default-800/50">
            <p className="text-xs font-medium leading-snug text-default-400">
              {t("accuracyLabel")}
            </p>
            <p className="mt-1 text-lg font-bold leading-tight text-foreground">
              {hasData ? `${accuracy}%` : "--"}
            </p>
          </div>

          <div className="rounded-xl bg-default-50 p-3 dark:bg-default-800/50">
            <p className="text-xs font-medium leading-snug text-default-400">
              {t("correctLabel")}
            </p>
            <p className="mt-1 text-lg font-bold leading-tight text-foreground">
              {safeCorrect}/{hasData ? safeAnswered : safeTotal}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        {!isCompleted && !isExpired && totalSections > 0 && (
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
              {t("correctCount", { count: safeCorrect })}
            </span>
          )}

          {test.totalTimeSpent !== null &&
            test.totalTimeSpent !== undefined &&
            test.totalTimeSpent > 0 && (
              <span className="flex items-center gap-1.5">
                <Clock width={14} />
                {t("minutesLabel", {
                  count: Math.round(test.totalTimeSpent / 60),
                })}
              </span>
            )}

          {isCompleted && typeof test.scaledScore === "number" && (
            <span className="flex items-center gap-1.5">
              <Cup width={14} />
              {test.scaledScore}
            </span>
          )}
        </div>

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