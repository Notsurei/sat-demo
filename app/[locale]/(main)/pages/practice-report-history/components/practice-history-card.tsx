"use client";

import { Button, Chip, Card } from "@heroui/react";
import { useLocale, useTranslations } from "next-intl";
import {
  BookOpen,
  Calendar,
  CircleCheck,
  Clock,
  ArrowRight,
} from "@gravity-ui/icons";

interface Practice {
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
  status: string;
  mode: string;
}

interface PracticeHistoryCardProps {
  practice: Practice;
  onAction?: (practice: Practice) => void;
}

type StatusKey = "done" | "inProgress" | "abandoned";

const STATUS_MAP: Record<string, { key: StatusKey; color: string }> = {
  DONE: { key: "done", color: "success" },
  IN_PROGRESS: { key: "inProgress", color: "warning" },
  ABANDONED: { key: "abandoned", color: "default" },
};

export default function PracticeHistoryCard({
  practice,
  onAction,
}: PracticeHistoryCardProps) {
  const t = useTranslations("practiceReport.practiceHistory.card");
  const locale = useLocale();

  const accuracy =
    practice.totalQuestions > 0
      ? Math.round(
        (practice.correctAnswers / practice.totalQuestions) * 100,
      )
      : 0;

  const isCompleted = practice.status === "DONE";
  const isInProgress = practice.status === "IN_PROGRESS";

  const statusMeta =
    STATUS_MAP[practice.status] ?? {
      key: "abandoned" as const,
      color: "default",
    };

  const statusLabel = t(`statusLabels.${statusMeta.key}`);

  const date = new Date(practice.startedAt).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Card className="border border-default-200 bg-background shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <Card.Content className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${isInProgress
                  ? "bg-warning/10 text-warning"
                  : "bg-primary/10 text-primary"
                }`}
            >
              <BookOpen width={20} />
            </div>

            <div className="min-w-0">
              <h3 className="truncate font-semibold leading-tight text-foreground">
                {practice.subject}
              </h3>

              <p className="truncate text-xs leading-snug text-default-400">
                {practice.domain || t("defaultDomain")}
              </p>
            </div>
          </div>

          <Chip
            size="sm"
            color={statusMeta.color as any}
            variant="primary"
            className="shrink-0 font-semibold"
          >
            {statusLabel}
          </Chip>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-default-50 p-3">
            <p className="text-xs font-medium leading-snug text-default-400">
              {t("scoreLabel")}
            </p>

            <p className="mt-1 text-lg font-bold leading-tight text-foreground">
              {isCompleted ? practice.score ?? "--" : "--"}
            </p>
          </div>

          <div className="rounded-xl bg-default-50 p-3">
            <p className="text-xs font-medium leading-snug text-default-400">
              {t("accuracyLabel")}
            </p>

            <p className="mt-1 text-lg font-bold leading-tight text-foreground">
              {accuracy}%
            </p>
          </div>

          <div className="rounded-xl bg-default-50 p-3">
            <p className="text-xs font-medium leading-snug text-default-400">
              {t("questionsLabel")}
            </p>

            <p className="mt-1 text-lg font-bold leading-tight text-foreground">
              {practice.totalQuestions}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-default-400">
          <span className="flex items-center gap-1.5">
            <Calendar width={14} />
            {date}
          </span>

          <span className="flex items-center gap-1.5">
            <CircleCheck width={14} />
            {t("correctLabel", { count: practice.correctAnswers })}
          </span>

          {practice.timeSpent !== null &&
            practice.timeSpent !== undefined && (
              <span className="flex items-center gap-1.5">
                <Clock width={14} />
                {t("minutesLabel", {
                  count: Math.round(practice.timeSpent / 60),
                })}
              </span>
            )}
        </div>

        <div className="mt-5 border-t border-default-200 pt-4">
          {isInProgress ? (
            <Button
              size="sm"
              variant="primary"
              className="w-full font-semibold"
              onPress={() => onAction?.(practice)}
            >
              {t("buttons.continue")}
              <ArrowRight width={15} />
            </Button>
          ) : (
            <Button
              size="sm"
              variant="primary"
              className="w-full font-semibold"
              onPress={() => onAction?.(practice)}
              isDisabled={!isCompleted}
            >
              {t("buttons.viewDetails")}
              {isCompleted && <ArrowRight width={15} />}
            </Button>
          )}
        </div>
      </Card.Content>
    </Card>
  );
}