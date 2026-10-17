"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button, Card, Chip } from "@heroui/react";

import { ArrowRight, BookOpen, Clock, PencilToLine } from "@gravity-ui/icons";

import TestModeModal from "../modal-button/test-mode-modal";

interface PracticeHistory {
  id: string;
  subject: string;
  mode: string;

  startedAt: Date | string | null;

  correctAnswers: number;
  totalQuestions: number;

  timeSpent?: number | null;
}

interface RecentPracticeHistoryProps {
  history: PracticeHistory[];
  loading?: boolean;
}

export default function RecentPracticeHistory({
  history,
  loading = false,
}: RecentPracticeHistoryProps) {
  const router = useRouter();
  // ✅ trỏ vào namespace con trong practiceReport
  const t = useTranslations("practiceReport.recentPracticeHistory");

  const getAccuracy = (practice: PracticeHistory) => {
    if (!practice.totalQuestions) return 0;

    return Math.round(
      (practice.correctAnswers / practice.totalQuestions) * 100,
    );
  };

  const getSubjectName = (subject: string) => {
    if (subject === "SAT_MATH" || subject === "SAT_READING_WRITING") {
      return t(`subjects.${subject}`);
    }
    return subject;
  };

  const getModeName = (mode: string) => {
    if (mode === "PRACTICE" || mode === "FULL_TEST" || mode === "TARGETED") {
      return t(`modes.${mode}`);
    }
    return mode;
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return t("unknownDate");

    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));
  };

  const formatTime = (seconds: number) => {
    if (!seconds) return t("time.minutes", { count: 0 });

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return t("time.hoursMinutes", { hours, minutes });
    }

    return t("time.minutes", { count: minutes });
  };

  return (
    <Card className="border border-default-200 bg-background shadow-sm lg:col-span-2">

      <Card.Header className="flex items-center justify-between border-b border-default-200 px-6 py-5">
        <div>
          <h2 className="text-lg font-semibold">{t("title")}</h2>

          <p className="mt-1 text-sm text-default-500">{t("subtitle")}</p>
        </div>

        <Button
          size="sm"
          variant="ghost"
          onPress={() => router.push("/pages/practice-report-history")}
        >
          {t("viewAll")}
          <ArrowRight width={15} />
        </Button>
      </Card.Header>

      <Card.Content className="p-0">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <p className="text-sm text-default-400">{t("loading")}</p>
          </div>
        ) : history.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <PencilToLine width={26} />
            </div>

            <h3 className="font-semibold">{t("emptyTitle")}</h3>

            <p className="mt-1 max-w-sm text-sm text-default-500">
              {t("emptyDescription")}
            </p>

            <div className="mt-5">
              <TestModeModal />
            </div>
          </div>
        ) : (
          <div className="divide-y divide-default-200">
            {history.slice(0, 5).map((practice) => {
              const accuracy = getAccuracy(practice);

              return (
                <Button
                  key={practice.id}
                  variant="outline"
                  onPress={() =>
                    router.push(`/pages/practice-report/${practice.id}`)
                  }
                  className="
                    group h-auto w-full justify-start
                    border-0 bg-background
                    px-4 py-4
                    transition-all duration-200
                    hover:bg-default-50
                    hover:shadow-sm
                    sm:px-5
                  "
                >
                  <div className="flex w-full items-center gap-4">

                    <div
                      className={`
                        flex h-11 w-11 shrink-0
                        items-center justify-center
                        rounded-xl
                        ${practice.subject === "SAT_MATH"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-violet-100 text-violet-600"
                        }
                      `}
                    >
                      {practice.subject === "SAT_MATH" ? (
                        <PencilToLine width={19} />
                      ) : (
                        <BookOpen width={19} />
                      )}
                    </div>

                    <div className="min-w-0 flex-1 text-left">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-semibold text-foreground">
                          {getSubjectName(practice.subject)}
                        </h3>

                        <Chip
                          size="sm"
                          variant="primary"
                          color="default"
                          className="h-6 px-2 text-xs"
                        >
                          {getModeName(practice.mode)}
                        </Chip>
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-default-400">
                        <span>{formatDate(practice.startedAt)}</span>

                        <span className="h-1 w-1 rounded-full bg-default-300" />

                        <span>
                          {t("correctFraction", {
                            correct: practice.correctAnswers,
                            total: practice.totalQuestions,
                          })}
                        </span>

                        {practice.timeSpent != null && (
                          <>
                            <span className="h-1 w-1 rounded-full bg-default-300" />

                            <span className="flex items-center gap-1">
                              <Clock width={12} />

                              {formatTime(practice.timeSpent)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="hidden shrink-0 text-right sm:block">
                      <p
                        className={`
                          text-lg font-bold
                          ${accuracy >= 80
                            ? "text-success"
                            : accuracy >= 60
                              ? "text-warning"
                              : "text-danger"
                          }
                        `}
                      >
                        {accuracy}%
                      </p>

                      <p className="text-[11px] text-default-400">
                        {t("accuracyLabel")}
                      </p>
                    </div>

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
                </Button>
              );
            })}
          </div>
        )}
      </Card.Content>
    </Card>
  );
}