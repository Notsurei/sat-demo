"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { Button, Chip } from "@heroui/react";
import { Check, Clock, TargetDart, Xmark } from "@gravity-ui/icons";
import { useTranslations } from "next-intl";
import parse from "html-react-parser";

import MathText from "@/app/components/LaText/MathJax";
import ProgressBar from "@/app/components/progress-bar/progress-bar";

import { useAuthStore } from "@/zustand/auth-store";
import { useRouter } from "@/i18n/navigation";

import { computeSectionScaled, SAT_SECTION_MAX } from "./module-scoring";

interface AnswerDisplay {
  id?: string | null;
  label?: string | null;
  content?: string | null;
  text?: string | null;
}

interface OptionDisplay {
  id: string;
  label: string;
  content: string;
}

export interface ReportQuestion {
  number: number;
  questionId: string;
  subject?: string;
  sectionId?: string;
  sectionTitle?: string;
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
  timeSpent: number;
  explanation?: string | null;
  proTips?: string | null;
}

interface DifficultyStat {
  total: number;
  correct: number;
  accuracy: number;
}

interface DomainStat {
  domain: string;
  total: number;
  answered: number;
  unanswered: number;
  correct: number;
  incorrect: number;
  accuracy: number;
}

export interface SectionStat {
  id: string;
  sectionId: string;
  subject: string;
  title: string;
  order: number;
  total: number;
  answered: number;
  unanswered: number;
  correct: number;
  incorrect: number;
  accuracy: number;
  timeSpent: number;
  duration: number;
  questions: ReportQuestion[];
}

export interface ModuleReportData {
  session: {
    id: string;
    examId: string;
    status: string;
    startedAt: string;
    completedAt?: string | null;
    totalTimeSpent?: number | null;
  };
  exam: {
    id: string;
    title: string;
    totalQuestions: number;
    duration: number;
  };
  summary: {
    total: number;
    answered: number;
    unanswered: number;
    correct: number;
    incorrect: number;
    accuracy: number;
    rawScore: number;
    scaledScore?: number | null;
  };
  sections?: SectionStat[] | Record<string, unknown> | null;
  difficulty: {
    EASY: DifficultyStat;
    MEDIUM: DifficultyStat;
    HARD: DifficultyStat;
  };
  domains: DomainStat[];
  questions: ReportQuestion[];
}

const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [400, 900, 1500] as const;
const ERROR_GRACE_MS = 500;

export interface ModuleReportPageProps {
  subjectLabel: string;
  subjectFilter: "SAT_MATH" | "SAT_RW";
  apiPathTemplate: string;
  titleKey: "math" | "rw";
  gradientClass: string;
}

export default function ModuleReportPage({
  subjectLabel,
  subjectFilter,
  apiPathTemplate,
  titleKey,
  gradientClass,
}: ModuleReportPageProps) {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const sessionId = params?.sessionId;

  const tCommon = useTranslations("moduleReportCommon");

  const { checkAuth, isAuthenticated, isLoading } = useAuthStore();
  const [reportData, setReportData] = useState<ModuleReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!error) {
      setShowError(false);
      return;
    }
    const timer = setTimeout(() => setShowError(true), ERROR_GRACE_MS);
    return () => clearTimeout(timer);
  }, [error]);

  useEffect(() => {
    if (!sessionId || isLoading || !isAuthenticated) return;

    let cancelled = false;

    const fetchReportWithRetry = async () => {
      setLoading(true);
      setError(null);

      const url = apiPathTemplate.replace("{id}", sessionId);
      let lastErr: any = null;

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        if (cancelled) return;

        try {
          const response = await axios.get(url, { withCredentials: true });
          if (cancelled) return;

          if (response.data?.success) {
            setReportData(response.data.data);
            setLoading(false);
            return;
          }

          const msg =
            response.data?.message || response.data?.error || null;
          const isTransient =
            !msg || /not found|expired|try again/i.test(msg);

          if (isTransient && attempt < MAX_RETRIES) {
            await new Promise((r) =>
              setTimeout(r, RETRY_DELAYS_MS[attempt] ?? 1000),
            );
            continue;
          }

          if (!cancelled) {
            setError(msg || tCommon("notFound"));
            setLoading(false);
          }
          return;
        } catch (err: any) {
          lastErr = err;
          if (cancelled) return;

          const status = err.response?.status;
          const isRetryable =
            status === 404 ||
            status === 408 ||
            (status && status >= 500) ||
            !status;

          if (isRetryable && attempt < MAX_RETRIES) {
            await new Promise((r) =>
              setTimeout(r, RETRY_DELAYS_MS[attempt] ?? 1000),
            );
            continue;
          }

          if (!cancelled) {
            setError(
              err.response?.data?.message ||
              err.response?.data?.error ||
              tCommon("notFound"),
            );
            setLoading(false);
          }
          return;
        }
      }

      if (!cancelled) {
        setError(lastErr?.response?.data?.message || tCommon("notFound"));
        setLoading(false);
      }
    };

    void fetchReportWithRetry();
    return () => {
      cancelled = true;
    };
  }, [sessionId, isLoading, isAuthenticated, apiPathTemplate, tCommon]);

  const handleGoHome = () => router.push("/pages/home");

  const formatTime = (seconds?: number | null) => {
    if (!seconds || seconds <= 0) return "—";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const getAnswerText = (answer: AnswerDisplay | null | undefined): string => {
    if (!answer) return "—";
    if (answer.text?.trim()) return answer.text;
    if (answer.label) return answer.label;
    if (answer.content) return answer.content;
    return "—";
  };

  const getDifficultyColor = (d?: string | null) => {
    if (d === "EASY") return "success" as const;
    if (d === "MEDIUM") return "warning" as const;
    if (d === "HARD") return "danger" as const;
    return "default" as const;
  };

  const getDifficultyEmoji = (d?: string | null) =>
    d === "EASY" ? "🟢" : d === "MEDIUM" ? "🟡" : d === "HARD" ? "🔴" : "";

  const getQuestionStatus = (q: ReportQuestion) => {
    if (q.isCorrect === true)
      return { label: tCommon("status.correct"), color: "success" as const };
    if (q.isCorrect === false)
      return { label: tCommon("status.incorrect"), color: "danger" as const };
    return { label: tCommon("status.skipped"), color: "warning" as const };
  };

  const getQuestionTypeLabel = (type: string): string => {
    if (type === "MCQ") return tCommon("questionTypes.MCQ");
    if (type === "GRID_IN") return tCommon("questionTypes.GRID_IN");
    return tCommon("questionTypes.TEXT");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-default-50 p-6 dark:bg-default-900">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="text-default-500">{tCommon("loading")}</span>
        </div>
      </div>
    );
  }

  if (showError && (error || !reportData)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-default-50 p-6 dark:bg-default-900">
        <div className="text-center">
          <p className="mb-4 text-lg font-semibold text-danger">
            ❌ {error || tCommon("notFound")}
          </p>
          <div className="flex justify-center gap-2">
            <Button
              variant="primary"
              onPress={() => window.location.reload()}
            >
              Retry
            </Button>
            <Button variant="outline" onPress={handleGoHome}>
              {tCommon("goHome")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-default-50 p-6 dark:bg-default-900">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="text-default-500">{tCommon("loading")}</span>
        </div>
      </div>
    );
  }

  const summary = reportData.summary;
  const totalTime = reportData.session.totalTimeSpent ?? 0;
  const accuracyValue = Math.min(100, summary.accuracy ?? 0);

  function normalizeSections(raw: unknown): SectionStat[] {
    if (Array.isArray(raw)) {
      return [...raw].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }

    if (raw && typeof raw === "object") {
      const values = Object.values(raw as Record<string, unknown>);
      const flattened: SectionStat[] = [];
      for (const v of values) {
        if (Array.isArray(v)) flattened.push(...(v as SectionStat[]));
        else if (v && typeof v === "object" && "id" in v) {
          flattened.push(v as SectionStat);
        }
      }
      if (flattened.length > 0) {
        return flattened.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      }
    }
    return [];
  }

  const sortedSections = normalizeSections(reportData.sections);

  const sectionAgg = {
    total: sortedSections.reduce((s, x) => s + x.total, 0),
    correct: sortedSections.reduce((s, x) => s + x.correct, 0),
  };

  const isHard = sortedSections.some((s) => {
    const titleLower = (s.title ?? "").toLowerCase();
    return titleLower.includes("hard") || titleLower.includes("advanced");
  });

  const scaledScore = computeSectionScaled(
    subjectFilter === "SAT_MATH" ? "MATH" : "RW",
    sectionAgg.correct,
    sectionAgg.total,
    isHard,
  );

  const computeModuleContribution = (
    moduleCorrect: number,
    sectionCorrect: number,
    sectionScaled: number,
  ): number => {
    if (sectionCorrect === 0) return 0;
    return Math.round((moduleCorrect / sectionCorrect) * sectionScaled);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <h1
              className={`bg-gradient-to-r ${gradientClass} bg-clip-text text-3xl font-bold text-transparent md:text-5xl`}
            >
              {tCommon(`titles.report.${titleKey}`)}
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 md:text-base">
              {reportData.exam.title}
            </p>
          </div>
          <Button
            onPress={handleGoHome}
            className="bg-gradient-to-r from-blue-500 to-purple-500 px-6 font-semibold text-white shadow-md hover:shadow-lg md:px-8"
          >
            {tCommon("backHome")}
          </Button>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
          {[
            {
              label: tCommon("summary.score"),
              value: `${scaledScore}`,
              suffix: `/ ${SAT_SECTION_MAX}`,
              icon: <TargetDart />,
              className: "from-blue-400 to-purple-600",
            },
            {
              label: tCommon("summary.accuracy"),
              value: `${accuracyValue}%`,
              suffix: "",
              icon: <TargetDart />,
              className: "from-green-400 to-emerald-600",
            },
            {
              label: tCommon("summary.correct"),
              value: summary.correct,
              suffix: `/ ${summary.total}`,
              icon: <Check />,
              className: "from-blue-400 to-blue-600",
            },
            {
              label: tCommon("summary.timeSpent"),
              value: formatTime(totalTime),
              suffix: "",
              icon: <Clock />,
              className: "from-orange-400 to-amber-600",
            },
          ].map((card) => (
            <div
              key={card.label}
              className={`rounded-2xl bg-gradient-to-br ${card.className} p-6 text-white shadow-lg`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold opacity-90">
                    {card.label}
                  </p>
                  <div className="mt-2 flex items-baseline gap-1">
                    <p className="text-4xl font-bold">{card.value}</p>
                    {card.suffix && (
                      <span className="text-sm font-semibold opacity-80">
                        {card.suffix}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-5xl opacity-20">{card.icon}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-6 flex flex-col items-center justify-between gap-6 md:flex-row">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                {tCommon("overall.title")}
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {tCommon("overall.subtitle", { subject: subjectLabel })}
              </p>
            </div>
            <div className="text-center md:text-right">
              <div
                className={`bg-gradient-to-r ${gradientClass} bg-clip-text text-5xl font-bold text-transparent`}
              >
                {scaledScore}
              </div>
              <div className="text-sm font-semibold text-gray-500">
                {tCommon("overall.scoreLabel", { max: SAT_SECTION_MAX })}
              </div>
            </div>
          </div>

          <ProgressBar
            label={tCommon("overall.accuracy")}
            progress={accuracyValue}
            color="green"
            showLabel={true}
          />

          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            {tCommon("overall.correctFraction", {
              correct: sectionAgg.correct,
              total: sectionAgg.total,
              accuracy: accuracyValue,
            })}
            {" · "}
            {isHard ? tCommon("overall.hardPath") : tCommon("overall.easyPath")}
          </p>
        </div>

        {sortedSections.length > 1 && (
          <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-2 text-2xl font-bold text-gray-800 dark:text-white">
              {tCommon("moduleScores.title")}
            </h2>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              {tCommon("moduleScores.subtitle", { max: SAT_SECTION_MAX })}
            </p>

            <div className="space-y-3">
              {sortedSections.map((section, idx) => {
                const scaled = computeModuleContribution(
                  section.correct,
                  sectionAgg.correct,
                  scaledScore,
                );
                return (
                  <div
                    key={section.id}
                    className="flex items-center justify-between rounded-lg bg-white/70 px-4 py-3 dark:bg-gray-900/30"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-white">
                        {tCommon("moduleScores.moduleLabel", {
                          number: idx + 1,
                        })}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {tCommon("moduleScores.correctFraction", {
                          correct: section.correct,
                          total: section.total,
                          accuracy: section.accuracy,
                        })}
                      </p>
                    </div>
                    <div className="ml-4 shrink-0 text-right">
                      <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        {scaled}
                        <span className="text-xs font-semibold text-gray-500">
                          {" "}
                          {tCommon("moduleScores.pts")}
                        </span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-2xl font-bold text-gray-800 dark:text-white">
            {tCommon("info.title")}
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: tCommon("info.subject"), value: subjectLabel },
              { label: tCommon("info.questions"), value: summary.total },
              {
                label: tCommon("info.answered"),
                value: `${summary.answered} / ${summary.total}`,
              },
              { label: tCommon("info.unanswered"), value: summary.unanswered },
            ].map((item, i) => (
              <div
                key={item.label}
                className={`rounded-lg border-l-4 p-4 ${[
                  "bg-blue-50 border-blue-500",
                  "bg-purple-50 border-purple-500",
                  "bg-green-50 border-green-500",
                  "bg-orange-50 border-orange-500",
                ][i]
                  }`}
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

        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-6 text-2xl font-bold text-gray-800 dark:text-white">
            {tCommon("bySection.title")}
          </h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {sortedSections.map((section) => (
              <div
                key={section.id}
                className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-5 dark:border-blue-800 dark:from-blue-900/20 dark:to-cyan-900/20"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-bold text-gray-800 dark:text-white">
                      {section.title}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {tCommon("bySection.questionsCount", {
                        count: section.total,
                      })}
                    </p>
                  </div>
                  <Chip size="lg" className="font-bold">
                    {section.accuracy}%
                  </Chip>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      label: tCommon("bySection.correct"),
                      value: section.correct,
                      cls: "text-green-600",
                    },
                    {
                      label: tCommon("bySection.incorrect"),
                      value: section.incorrect,
                      cls: "text-red-500",
                    },
                    {
                      label: tCommon("bySection.skipped"),
                      value: section.unanswered,
                      cls: "text-orange-500",
                    },
                  ].map((x) => (
                    <div
                      key={x.label}
                      className="rounded-lg bg-white/70 p-3 dark:bg-gray-900/30"
                    >
                      <p className="text-xs text-gray-500">{x.label}</p>
                      <p className={`mt-1 text-lg font-bold ${x.cls}`}>
                        {x.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex justify-between text-xs text-gray-500">
                  <span>
                    {tCommon("bySection.timeLabel", {
                      time: formatTime(section.timeSpent),
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-6 text-2xl font-bold text-gray-800 dark:text-white">
            {tCommon("byDifficulty.title")}
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {(["EASY", "MEDIUM", "HARD"] as const).map((difficulty) => {
              const stat = reportData.difficulty[difficulty];
              const bgGradient =
                difficulty === "EASY"
                  ? "from-green-100 to-emerald-100 border-green-300"
                  : difficulty === "MEDIUM"
                    ? "from-yellow-100 to-amber-100 border-yellow-300"
                    : "from-red-100 to-pink-100 border-red-300";
              return (
                <div
                  key={difficulty}
                  className={`rounded-xl border-2 bg-gradient-to-br ${bgGradient} p-5`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-lg font-bold text-gray-800 dark:text-white">
                      {getDifficultyEmoji(difficulty)}{" "}
                      {tCommon(`byDifficulty.labels.${difficulty}`)}
                    </span>
                    <Chip size="lg" className="px-3 text-lg font-bold">
                      {stat.accuracy}%
                    </Chip>
                  </div>
                  <p className="text-sm font-semibold text-gray-700">
                    {tCommon("byDifficulty.correctFraction", {
                      correct: stat.correct,
                      total: stat.total,
                    })}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-6 text-2xl font-bold text-gray-800 dark:text-white">
            {tCommon("byDomain.title")}
          </h2>
          <div className="space-y-4">
            {reportData.domains.map((domain, index) => (
              <div key={domain.domain}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-800 dark:text-white md:text-base">
                    {index + 1}. {domain.domain}
                  </span>
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    {tCommon("byDomain.answeredFraction", {
                      correct: domain.correct,
                      answered: domain.answered,
                      accuracy: domain.accuracy,
                    })}
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
                      }`}
                    style={{ width: `${Math.min(100, domain.accuracy)}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {tCommon("byDomain.totalUnanswered", {
                    total: domain.total,
                    unanswered: domain.unanswered,
                  })}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div
            className={`bg-gradient-to-r ${gradientClass} px-6 py-4 md:px-8 md:py-6`}
          >
            <h2 className="text-2xl font-bold text-white md:text-3xl">
              {tCommon("questionReview.title")}
            </h2>
            <p className="mt-1 text-sm text-blue-100">
              {tCommon("questionReview.subtitle")}
            </p>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {reportData.questions.map((question) => {
              const userAnswer = getAnswerText(question.selectedAnswer);
              const correctAnswer = getAnswerText(question.correctAnswer);
              const status = getQuestionStatus(question);

              return (
                <div key={question.questionId} className="p-4 md:p-6">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-default-100 pb-3 dark:border-default-800">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex h-8 min-w-[40px] items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-600 px-3 text-sm font-bold">
                        Q{question.number}
                      </span>
                      {question.domain && (
                        <span className="text-sm font-semibold text-default-700 dark:text-default-300">
                          {question.domain}
                        </span>
                      )}
                      {question.subtopic && (
                        <>
                          <span className="text-default-300">•</span>
                          <span className="text-sm text-default-500">
                            {question.subtopic}
                          </span>
                        </>
                      )}
                      {question.difficulty && (
                        <Chip
                          size="sm"
                          color={getDifficultyColor(question.difficulty)}
                          className="text-[10px] font-bold"
                        >
                          {getDifficultyEmoji(question.difficulty)}{" "}
                          {question.difficulty}
                        </Chip>
                      )}
                      <Chip size="sm" className="text-[10px] font-medium">
                        {getQuestionTypeLabel(question.type)}
                      </Chip>
                      <Chip size="sm" className="gap-1 text-[10px]">
                        <Clock className="size-3" />
                        {formatTime(question.timeSpent)}
                      </Chip>
                    </div>
                    <Chip color={status.color} className="gap-1.5 font-bold">
                      {question.isCorrect === true ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : question.isCorrect === false ? (
                        <Xmark className="h-3.5 w-3.5" />
                      ) : (
                        <Clock className="h-3.5 w-3.5" />
                      )}
                      {status.label}
                    </Chip>
                  </div>

                  <div className="mb-3">
                    <p className="font-medium leading-relaxed text-gray-800 dark:text-white">
                      <MathText text={question.prompt || "—"} />
                    </p>
                    {question.passage && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm font-semibold text-blue-600 hover:underline">
                          {tCommon("questionReview.showPassage")}
                        </summary>
                        <div className="prose prose-sm mt-2 max-w-none rounded-lg bg-gray-100 p-3 dark:bg-gray-800">
                          {parse(question.passage)}
                        </div>
                      </details>
                    )}
                  </div>

                  {question.options && question.options.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        {tCommon("questionReview.allOptions")}
                      </p>
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                        {question.options.map((option) => {
                          const isSelected =
                            question.selectedAnswer?.id === option.id;
                          const isCorrect =
                            question.correctAnswer?.id === option.id;
                          return (
                            <div
                              key={option.id}
                              className={`flex flex-col gap-1 rounded-lg border p-3 text-sm ${isSelected && isCorrect
                                ? "border-green-500 bg-green-50"
                                : isSelected && !isCorrect
                                  ? "border-red-500 bg-red-50"
                                  : !isSelected && isCorrect
                                    ? "border-green-300 bg-green-50/50"
                                    : "border-gray-200"
                                }`}
                            >
                              <div className="flex items-start gap-2">
                                <span className="min-w-[24px] font-semibold">
                                  {option.label}.
                                </span>
                                <span className="flex-1 text-gray-800 dark:text-white">
                                  <MathText text={option.content} />
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-xs">
                                {isSelected && (
                                  <span className="font-bold text-blue-600">
                                    {tCommon("questionReview.yourChoice")}
                                  </span>
                                )}
                                {isCorrect && (
                                  <span className="font-bold text-green-600">
                                    {tCommon("questionReview.correctOption")}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {(!question.options || question.options.length === 0) && (
                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div
                        className={`rounded-lg border-2 p-3 ${question.isCorrect === true
                          ? "border-green-200 bg-green-50"
                          : question.isCorrect === false
                            ? "border-red-200 bg-red-50"
                            : "border-yellow-200 bg-yellow-50"
                          }`}
                      >
                        <p className="text-xs font-bold uppercase text-gray-500">
                          {tCommon("questionReview.yourAnswer")}
                        </p>
                        <p className="font-semibold text-gray-800 dark:text-white">
                          {userAnswer}
                        </p>
                      </div>
                      <div className="rounded-lg border-2 border-green-200 bg-green-50 p-3">
                        <p className="text-xs font-bold uppercase text-gray-500">
                          {tCommon("questionReview.correctAnswer")}
                        </p>
                        <p className="font-semibold text-gray-800 dark:text-white">
                          {correctAnswer}
                        </p>
                      </div>
                    </div>
                  )}

                  {question.explanation && (
                    <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                      <p className="mb-1 text-xs font-bold uppercase text-blue-600">
                        {tCommon("questionReview.explanation")}
                      </p>
                      <div className="text-sm leading-relaxed text-gray-700">
                        <MathText text={question.explanation} />
                      </div>
                    </div>
                  )}

                  {question.proTips && (
                    <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
                      <p className="text-sm font-semibold text-primary">
                        {tCommon("questionReview.proTip")}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-default-600">
                        {question.proTips}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <Button
            onPress={handleGoHome}
            className="bg-gradient-to-r from-blue-500 to-purple-500 px-8 font-semibold text-white"
            size="lg"
          >
            {tCommon("backHome")}
          </Button>
        </div>
      </div>
    </div>
  );
}
