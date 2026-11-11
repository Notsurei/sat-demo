"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Chip } from "@heroui/react";
import { ArrowRight, BookOpen, Calendar, Check } from "@gravity-ui/icons";
import { useTranslations } from "next-intl";

import type { TestHistoryProps } from "./type";
import {
  formatHistoryDate,
  getAccuracyColor,
  getHistoryStatusColor,
  getHistoryStatusName,
} from "./history-utils";
import TestModeModal from "../forms/test-mode-modal";

interface RecentTestHistoryProps extends TestHistoryProps {
  titleKey: string;
  descriptionKey: string;
  reportHistoryPath: string;
  reportPath: string;
}

const getCorrect = (t: any): number =>
  Number(t?.totalCorrect ?? t?.correct ?? 0);

const getWrong = (t: any): number =>
  Number(t?.totalWrong ?? t?.incorrect ?? 0);

const getSkipped = (t: any): number =>
  Number(t?.totalSkipped ?? t?.unanswered ?? 0);

const getAnswered = (t: any): number =>
  Number(
    t?.answeredQuestions ??
    t?.answered ??
    getCorrect(t) + getWrong(t),
  );

const getTotal = (t: any): number => {
  const explicit = Number(t?.totalQuestions ?? 0);
  if (explicit > 0) return explicit;
  return getCorrect(t) + getWrong(t) + getSkipped(t);
};

const getExamTitle = (t: any): string =>
  t?.examTitle ?? t?.exam?.title ?? t?.section?.title ?? "Test";

const getScaledScore = (t: any): number | null => {
  const s = t?.scaledScore;
  return typeof s === "number" && Number.isFinite(s) ? s : null;
};

export default function RecentTestHistory({
  history,
  loading = false,
  titleKey,
  descriptionKey,
  reportHistoryPath,
  reportPath,
}: RecentTestHistoryProps) {
  const router = useRouter();
  const t = useTranslations("dashboard.history");

  const handleTestClick = (test: (typeof history)[number]) => {
    if (test.status !== "COMPLETED") return;
    router.push(`${reportPath}/${test.id}`);
  };

  return (
    <Card className="border border-default-200 bg-background shadow-sm">
      <Card.Header className="flex items-center justify-between border-b border-default-200 px-6 py-5">
        <div>
          <h2 className="text-lg font-semibold">{t(titleKey)}</h2>
          <p className="mt-1 text-sm text-default-500">{t(descriptionKey)}</p>
        </div>

        <Button
          size="sm"
          variant="ghost"
          onPress={() => router.push(reportHistoryPath)}
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
              <BookOpen width={26} />
            </div>
            <h3 className="font-semibold">{t("noTestHistory")}</h3>
            <p className="mt-1 max-w-sm text-sm text-default-500">
              {t("noTestHistoryDescription")}
            </p>

            <TestModeModal />
          </div>
        ) : (
          <div className="divide-y divide-default-200">
            {history.slice(0, 5).map((test) => {
              const isCompleted = test.status === "COMPLETED";

              const correctCount = getCorrect(test);
              const wrongCount = getWrong(test);
              const totalQuestions = getTotal(test);
              const answeredCount = getAnswered(test);
              const unansweredCount = Math.max(
                0,
                totalQuestions - answeredCount,
              );

              const accuracy =
                answeredCount > 0
                  ? Math.round((correctCount / answeredCount) * 100)
                  : 0;

              const examTitle = getExamTitle(test);
              const scaledScore = getScaledScore(test);

              return (
                <button
                  key={test.id}
                  type="button"
                  onClick={() => handleTestClick(test)}
                  disabled={!isCompleted}
                  className="
                    group
                    flex w-full
                    items-center
                    px-4 py-4
                    text-left
                    transition-all duration-200
                    hover:bg-default-50
                    hover:shadow-sm
                    disabled:cursor-default
                    sm:px-5
                  "
                >
                  <div className="flex w-full items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      {isCompleted ? (
                        <Check width={19} />
                      ) : (
                        <BookOpen width={19} />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-semibold text-foreground">
                          {examTitle}
                        </h3>

                        <Chip
                          size="sm"
                          variant="primary"
                          color={getHistoryStatusColor(test.status)}
                          className="h-6 px-2 text-xs"
                        >
                          {getHistoryStatusName(test.status)}
                        </Chip>
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-default-400">
                        <span className="flex items-center gap-1">
                          <Calendar width={12} />
                          {formatHistoryDate(test.startedAt)}
                        </span>

                        <span className="h-1 w-1 rounded-full bg-default-300" />

                        <span>
                          {correctCount}/{answeredCount || totalQuestions}{" "}
                          {t("correct")}
                        </span>

                        <span className="h-1 w-1 rounded-full bg-default-300" />

                        <span>
                          {unansweredCount} {t("unanswered")}
                        </span>
                      </div>
                    </div>

                    <div className="hidden shrink-0 text-right sm:block">
                      {isCompleted ? (
                        <>
                          <p
                            className={`text-lg font-bold ${getAccuracyColor(accuracy)}`}
                          >
                            {answeredCount > 0 ? `${accuracy}%` : "--"}
                          </p>

                          <p className="text-[11px] text-default-400">
                            {t("accuracy")}
                          </p>

                          {scaledScore !== null && (
                            <p className="mt-0.5 text-xs font-semibold text-foreground">
                              {scaledScore} SAT
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-sm font-semibold text-default-400">
                          —
                        </p>
                      )}
                    </div>

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-default-300 transition-all duration-200 group-hover:bg-primary/10 group-hover:text-primary">
                      <ArrowRight
                        width={17}
                        className="transition-transform duration-200 group-hover:translate-x-0.5"
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