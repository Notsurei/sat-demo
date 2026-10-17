"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { Button, Chip } from "@heroui/react";
import { Check, Clock, TargetDart, Xmark } from "@gravity-ui/icons";
import { useTranslations } from "next-intl";
import parse from "html-react-parser";

import ProgressBar from "@/app/components/progress-bar/progress-bar";
import MathText from "@/app/components/LaText/MathJax";
import RetryPracticeButton from "@/app/components/modal-button/retry-practice";

import PriorityFocusAreas from "@/app/components/report/priority_focus_area";
import DomainAdviceCard from "@/app/components/report/domain_advice_card";

import { usePracticeTimerStore } from "@/zustand/practice-timer";
import { useAuthStore } from "@/zustand/auth-store";

import { useRouter } from "@/i18n/navigation";
import { analyzeDomains } from "@/app/[locale]/(main)/pages/dashboard/hooks/domain_mapping";

interface AnswerDisplay {
  id?: string;
  label?: string;
  content?: string;
  text?: string | null;
}

interface OptionDisplay {
  id: string;
  label: string;
  content: string;
}

interface ReportQuestion {
  number: number;
  questionId: string;
  externalId?: string | null;
  prompt: string;
  passage?: string | null;
  domain?: string | null;
  subtopic?: string | null;
  difficulty?: string | null;
  type: string;
  options?: OptionDisplay[];
  selectedAnswer?: AnswerDisplay | null;
  correctAnswer?: AnswerDisplay | null;
  isCorrect: boolean | null;
  explanation?: string | null;
  proTips?: string | null;
  timeSpent: number;
}

interface DifficultyStat {
  total: number;
  correct: number;
  accuracy: number;
}

interface DomainStat {
  domain: string;
  total: number;
  correct: number;
  accuracy: number;
}

interface SubtopicStat {
  subtopic: string;
  domain: string;
  total: number;
  correct: number;
  accuracy: number;
}

interface ReportData {
  success: boolean;
  practice: {
    id: string;
    subject: string;
    domain?: string | null;
    subtopic?: string | null;
    mode: string;
    status: string;
    startedAt: string;
    completedAt: string;
    timeSpent: number;
  };
  summary: {
    total: number;
    answered: number;
    unanswered: number;
    correct: number;
    incorrect: number;
    accuracy: number;
  };
  difficulty: {
    EASY: DifficultyStat;
    MEDIUM: DifficultyStat;
    HARD: DifficultyStat;
  };
  domains: DomainStat[];
  subtopics: SubtopicStat[];
  questions: ReportQuestion[];
}

export default function PracticeReportPage() {
  const params = useParams<{ practiceId: string }>();
  const router = useRouter();
  const practiceId = params?.practiceId;

  // 👇 CHỈ ĐỔI DÒNG NÀY
  const t = useTranslations("practiceReport");

  const { checkAuth, isAuthenticated, isLoading } = useAuthStore();
  const { reset: resetTimer } = usePracticeTimerStore();

  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const domainAnalysis = useMemo(() => {
    if (!reportData?.domains) return [];
    return analyzeDomains(reportData.domains);
  }, [reportData]);

  const weakDomains = useMemo(
    () => domainAnalysis.filter((d) => d.isWeak),
    [domainAnalysis],
  );

  const incorrectCount = useMemo(() => {
    if (!reportData) return 0;

    return reportData.questions.filter((q) => {
      const v = q.isCorrect as unknown;
      if (v === false || v === 0 || v === "false") return true;

      if (v === null || v === undefined) return true;

      return false;
    }).length;
  }, [reportData]);

  const formatTime = (seconds?: number) => {
    if (!seconds || seconds <= 0) return "—";

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }

    return `${remainingSeconds}s`;
  };

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!practiceId) return;

    let cancelled = false;

    const fetchReport = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(
          `/api/practice/report/${practiceId}`,
          { withCredentials: true },
        );

        if (cancelled) return;

        if (response.data?.success) {
          setReportData(response.data);
        } else {
          setError(response.data?.error || t("notFound"));
        }
      } catch (err: any) {
        if (cancelled) return;
        setError(err.response?.data?.error || t("notFound"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchReport();

    return () => {
      cancelled = true;
    };
  }, [practiceId, t]);

  const handleGoHome = () => {
    resetTimer();
    router.push("/pages/home");
  };

  const getAnswerText = (answer: AnswerDisplay | null | undefined): string => {
    if (!answer) return "—";
    if (answer.label) return answer.label;
    if (answer.text !== undefined && answer.text !== null)
      return answer.text || "—";
    if (answer.content) return answer.content;
    return "—";
  };

  const getQuestionTypeLabel = (type: string): string => {
    if (type === "MCQ") return t("questionReview.questionTypes.MCQ");
    if (type === "GRID_IN") return t("questionReview.questionTypes.GRID_IN");
    return t("questionReview.questionTypes.TEXT");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-default-50 p-6 dark:bg-default-900">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="text-default-500">{t("loading")}</span>
        </div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-default-50 p-6 dark:bg-default-900">
        <div className="text-center">
          <p className="mb-4 text-lg font-semibold text-danger">
            ❌ {error || t("notFound")}
          </p>
          <Button variant="primary" onPress={handleGoHome}>
            {t("goHome")}
          </Button>
        </div>
      </div>
    );
  }

  const summary = reportData.summary;
  const questions = reportData.questions;
  const totalTime = reportData.practice.timeSpent;
  const accuracyValue = Math.min(100, summary.accuracy);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex animate-fade-in flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <h1 className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-3xl font-bold text-transparent md:text-5xl">
              {t("title")}
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 md:text-base">
              {t("subtitle")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <RetryPracticeButton
              practiceId={practiceId}
              incorrectCount={incorrectCount}
            />

            <Button
              onPress={handleGoHome}
              className="bg-gradient-to-r from-blue-500 to-purple-500 px-6 font-semibold text-white shadow-md transition-shadow hover:shadow-lg md:px-8"
              size="md"
            >
              {t("backHome")}
            </Button>
          </div>
        </div>

        <div className="mb-8 grid animate-fade-in-up grid-cols-1 gap-4 md:grid-cols-4">
          {[
            {
              label: t("summary.accuracy"),
              value: `${accuracyValue}%`,
              icon: <TargetDart />,
              className: "from-green-400 to-emerald-600",
              valueClassName: "text-4xl",
            },
            {
              label: t("summary.correct"),
              value: summary.correct,
              icon: <Check />,
              className: "from-blue-400 to-blue-600",
              valueClassName: "text-4xl",
            },
            {
              label: t("summary.incorrect"),
              value: summary.incorrect,
              icon: <Xmark />,
              className: "from-red-400 to-pink-600",
              valueClassName: "text-4xl",
            },
            {
              label: t("summary.timeSpent"),
              value: `${Math.floor(totalTime / 60)}m ${totalTime % 60}s`,
              icon: <Clock />,
              className: "from-orange-400 to-amber-600",
              valueClassName: "text-3xl",
            },
          ].map((card) => (
            <div
              key={card.label}
              className={`rounded-2xl bg-gradient-to-br ${card.className} p-6 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold opacity-90">
                    {card.label}
                  </p>
                  <p className={`mt-2 font-bold ${card.valueClassName}`}>
                    {card.value}
                  </p>
                </div>
                <div className="text-5xl opacity-20">{card.icon}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-8 animate-fade-in-up rounded-2xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              {t("overall.title")}
            </h2>
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-3xl font-bold text-transparent">
              {summary.correct}/{summary.total}
            </span>
          </div>
          <ProgressBar
            label={t("overall.score")}
            progress={summary.accuracy}
            color="green"
            showLabel={true}
          />
        </div>

        <div className="mb-8 animate-fade-in-up rounded-2xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-2xl font-bold text-gray-800 dark:text-white">
            {t("practiceInfo.title")}
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              {
                label: t("practiceInfo.subject"),
                value: reportData.practice.subject,
                className: "bg-blue-50 dark:bg-blue-900/20 border-blue-500",
              },
              {
                label: t("practiceInfo.mode"),
                value: reportData.practice.mode,
                className:
                  "bg-purple-50 dark:bg-purple-900/20 border-purple-500",
              },
              {
                label: t("practiceInfo.answered"),
                value: `${summary.answered} / ${summary.total}`,
                className: "bg-green-50 dark:bg-green-900/20 border-green-500",
              },
              {
                label: t("practiceInfo.unanswered"),
                value: summary.unanswered,
                className:
                  "bg-orange-50 dark:bg-orange-900/20 border-orange-500",
              },
            ].map((item) => (
              <div
                key={item.label}
                className={`rounded-lg border-l-4 p-4 ${item.className}`}
              >
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                  {item.label}
                </p>
                <p className="mt-1 text-lg font-bold text-gray-800 dark:text-white">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-8 animate-fade-in-up rounded-2xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-6 text-2xl font-bold text-gray-800 dark:text-white">
            {t("byDifficulty.title")}
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {(["EASY", "MEDIUM", "HARD"] as const).map((difficulty) => {
              const stat = reportData.difficulty[difficulty];
              const bgGradient =
                difficulty === "EASY"
                  ? "from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border-green-300 dark:border-green-700"
                  : difficulty === "MEDIUM"
                    ? "from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 border-yellow-300 dark:border-yellow-700"
                    : "from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30 border-red-300 dark:border-red-700";

              const accentColor =
                difficulty === "EASY"
                  ? "success"
                  : difficulty === "MEDIUM"
                    ? "warning"
                    : "danger";

              return (
                <div
                  key={difficulty}
                  className={`rounded-xl border-2 bg-gradient-to-br ${bgGradient} p-5 transition-all duration-300 hover:shadow-lg`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-lg font-bold text-gray-800 dark:text-white">
                      {t(`byDifficulty.labels.${difficulty}`)}
                    </span>
                    <Chip
                      size="lg"
                      color={accentColor}
                      className="px-3 text-lg font-bold"
                    >
                      {stat.accuracy}%
                    </Chip>
                  </div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {t("byDifficulty.correctFraction", {
                      correct: stat.correct,
                      total: stat.total,
                    })}
                  </p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/50 dark:bg-gray-900/30">
                    <div
                      className={`h-full bg-gradient-to-r ${difficulty === "EASY"
                        ? "from-green-400 to-emerald-500"
                        : difficulty === "MEDIUM"
                          ? "from-yellow-400 to-amber-500"
                          : "from-red-400 to-pink-500"
                        }`}
                      style={{ width: `${stat.accuracy}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mb-8 animate-fade-in-up rounded-2xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-6 text-2xl font-bold text-gray-800 dark:text-white">
            {t("byDomain.title")}
          </h2>
          <div className="space-y-4">
            {reportData.domains.map((domain, idx) => (
              <div key={domain.domain} className="group">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-800 dark:text-white md:text-base">
                    {idx + 1}. {domain.domain}
                  </span>
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-sm font-bold text-transparent">
                    {domain.correct}/{domain.total} ({domain.accuracy}%)
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className={`h-full bg-gradient-to-r ${domain.accuracy >= 80
                      ? "from-green-400 to-emerald-500"
                      : domain.accuracy >= 60
                        ? "from-blue-400 to-cyan-500"
                        : domain.accuracy >= 40
                          ? "from-yellow-400 to-amber-500"
                          : "from-red-400 to-pink-500"
                      } transition-all duration-500 ease-out`}
                    style={{ width: `${domain.accuracy}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6 animate-fade-in-up">
          <PriorityFocusAreas weakDomains={weakDomains} />
        </div>

        {weakDomains.length > 0 && (
          <div className="mb-8 animate-fade-in-up space-y-3">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              📖 {t("domainAdvice.title")}
            </h2>

            {weakDomains.map(({ domain, domainKey, accuracy }) => {
              if (!domainKey) return null;

              return (
                <DomainAdviceCard
                  key={domain}
                  domainKey={domainKey}
                  accuracy={accuracy}
                />
              );
            })}
          </div>
        )}

        <div className="animate-fade-in-up overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4 md:px-8 md:py-6">
            <h2 className="text-2xl font-bold text-white md:text-3xl">
              {t("questionReview.title")}
            </h2>
            <p className="mt-1 text-sm text-blue-100">
              {t("questionReview.subtitle")}
            </p>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {questions.map((q) => {
              const userAnswerDisplay = getAnswerText(q.selectedAnswer);
              const correctAnswerDisplay = getAnswerText(q.correctAnswer);

              return (
                <div
                  key={q.questionId}
                  className="p-4 transition-all duration-200 md:p-6"
                >
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-default-100 pb-3 dark:border-default-800">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex h-8 min-w-[40px] items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-600 px-3 text-sm font-bold shadow-sm shadow-primary/20">
                        Q{q.number}
                      </span>

                      {q.domain && (
                        <span className="text-sm font-semibold text-default-700 dark:text-default-300">
                          {q.domain}
                        </span>
                      )}

                      {q.subtopic && (
                        <>
                          <span className="text-default-300 dark:text-default-600">
                            •
                          </span>
                          <span className="text-sm text-default-500 dark:text-default-400">
                            {q.subtopic}
                          </span>
                        </>
                      )}

                      {q.difficulty && (
                        <Chip
                          size="sm"
                          variant="tertiary"
                          color={
                            q.difficulty === "EASY"
                              ? "success"
                              : q.difficulty === "MEDIUM"
                                ? "warning"
                                : "danger"
                          }
                          className="text-[10px] font-bold"
                        >
                          {q.difficulty === "EASY" && "🟢"}
                          {q.difficulty === "MEDIUM" && "🟡"}
                          {q.difficulty === "HARD" && "🔴"}
                          {q.difficulty}
                        </Chip>
                      )}

                      <Chip
                        size="sm"
                        variant="tertiary"
                        className="text-[14px] font-medium text-default-500 dark:text-default-400"
                      >
                        {getQuestionTypeLabel(q.type)}
                      </Chip>

                      {q.timeSpent !== undefined && (
                        <Chip
                          size="sm"
                          variant="tertiary"
                          className="gap-1 font-medium text-[10px] text-default-500"
                        >
                          <Clock className="size-3.5" />
                          {formatTime(q.timeSpent)}
                        </Chip>
                      )}
                    </div>

                    <Chip
                      size="sm"
                      color={q.isCorrect ? "success" : "danger"}
                      variant="tertiary"
                      className="gap-1.5 pl-2.5 font-bold shadow-sm"
                    >
                      {q.isCorrect ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Xmark className="h-3.5 w-3.5" />
                      )}
                    </Chip>
                  </div>

                  <div className="mb-3">
                    <p className="font-medium leading-relaxed text-gray-800 dark:text-white">
                      <MathText text={q.prompt || "—"} />
                    </p>
                    {q.passage && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm font-semibold text-blue-600 hover:underline">
                          {t("questionReview.showPassage")}
                        </summary>
                        <div className="prose prose-sm mt-2 max-w-none whitespace-pre-wrap rounded-lg bg-gray-100 p-3 leading-relaxed text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          {parse(q.passage)}
                        </div>
                      </details>
                    )}
                  </div>

                  {q.options && q.options.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        {t("questionReview.allOptions")}
                      </p>
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                        {q.options.map((opt) => {
                          const isSelected = q.selectedAnswer?.id === opt.id;
                          const isCorrect = q.correctAnswer?.id === opt.id;

                          return (
                            <div
                              key={opt.id}
                              className={`flex flex-col gap-1 rounded-lg border p-3 text-sm ${isSelected && isCorrect
                                ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                : isSelected && !isCorrect
                                  ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                                  : !isSelected && isCorrect
                                    ? "border-green-300 bg-green-50/50 dark:bg-green-900/10"
                                    : "border-gray-200 dark:border-gray-700"
                                }`}
                            >
                              <div className="flex items-start gap-2">
                                <span className="min-w-[24px] font-semibold text-gray-600 dark:text-gray-400">
                                  {opt.label}.
                                </span>
                                <span className="flex-1 text-gray-800 dark:text-white">
                                  <MathText text={opt.content} />
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-xs">
                                {isSelected && (
                                  <span className="font-bold text-blue-600 dark:text-blue-400">
                                    {t("questionReview.yourChoice")}
                                  </span>
                                )}
                                {isCorrect && (
                                  <span className="font-bold text-green-600 dark:text-green-400">
                                    {t("questionReview.correctOption")}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {(!q.options || q.options.length === 0) && (
                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div
                        className={`rounded-lg border-2 p-3 ${q.isCorrect
                          ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                          : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
                          }`}
                      >
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            {t("questionReview.yourAnswer")}
                          </span>
                          {q.isCorrect ? (
                            <span className="text-green-600 dark:text-green-400">
                              ✓
                            </span>
                          ) : (
                            <span className="text-red-600 dark:text-red-400">
                              ✗
                            </span>
                          )}
                        </div>
                        <p className="font-semibold text-gray-800 dark:text-white">
                          {userAnswerDisplay || "—"}
                        </p>
                      </div>

                      <div className="rounded-lg border-2 border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            {t("questionReview.correctAnswer")}
                          </span>
                          <span className="text-green-600 dark:text-green-400">
                            ✓
                          </span>
                        </div>
                        <p className="font-semibold text-gray-800 dark:text-white">
                          {correctAnswerDisplay || "—"}
                        </p>
                      </div>
                    </div>
                  )}

                  {q.explanation && (
                    <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
                      <p className="mb-1 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                        {t("questionReview.explanation")}
                      </p>
                      <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                        <MathText text={q.explanation} />
                      </div>
                    </div>
                  )}

                  {q.proTips && (
                    <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
                      <p className="text-sm font-semibold text-primary">
                        {t("questionReview.proTip")}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-default-600">
                        {q.proTips}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}