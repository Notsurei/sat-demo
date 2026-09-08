"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { usePracticeTimerStore } from "@/zustand/practice-timer";
import { Button, Chip } from "@heroui/react";
import ProgressBar from "@/app/components/progress-bar/progress-bar";
import { useAuthStore } from "@/zustand/auth-store";
import { Check, Clock, TargetDart, Xmark } from "@gravity-ui/icons";
import MathText from "@/app/components/LaText/MathJax";
import parse from "html-react-parser";
import RetryPracticeButton from "@/app/components/modal-button/retry-practice";

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

  const { checkAuth, isAuthenticated, isLoading } = useAuthStore();
  const { reset: resetTimer } = usePracticeTimerStore();

  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const incorrectCount = React.useMemo(() => {
    if (!reportData) return 0;
    return reportData.questions.filter((q) => q.isCorrect === false).length;
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
  }, []);

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

        const response = await axios.get(`/api/practice/report/${practiceId}`, {
          withCredentials: true,
        });

        if (cancelled) return;

        if (response.data?.success) {
          setReportData(response.data);
        } else {
          setError(response.data?.error || "Failed to load practice report");
        }
      } catch (err: any) {
        if (cancelled) return;
        setError(err.response?.data?.error || "Failed to load practice report");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchReport();

    return () => {
      cancelled = true;
    };
  }, [practiceId]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-default-50 dark:bg-default-900 p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="text-default-500">Loading practice report...</span>
        </div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="min-h-screen bg-default-50 dark:bg-default-900 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-danger text-lg font-semibold mb-4">
            ❌ {error || "Report not found"}
          </p>
          <Button variant="primary" onPress={handleGoHome}>
            Go Home
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between animate-fade-in">
          <div className="flex-1">
            <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Practice Report
            </h1>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">
              Your detailed performance analysis
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <RetryPracticeButton
              practiceId={practiceId}
              incorrectCount={incorrectCount}
            />

            <Button
              onPress={handleGoHome}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold px-6 md:px-8 shadow-md hover:shadow-lg transition-shadow"
              size="md"
            >
              ← Back Home
            </Button>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4 animate-fade-in-up">
          {[
            {
              label: "Accuracy",
              value: `${accuracyValue}%`,
              icon: <TargetDart />,
              className: "from-green-400 to-emerald-600",
              valueClassName: "text-4xl",
            },
            {
              label: "Correct",
              value: summary.correct,
              icon: <Check />,
              className: "from-blue-400 to-blue-600",
              valueClassName: "text-4xl",
            },
            {
              label: "Incorrect",
              value: summary.incorrect,
              icon: <Xmark />,
              className: "from-red-400 to-pink-600",
              valueClassName: "text-4xl",
            },
            {
              label: "Time Spent",
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

        <div className="mb-8 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              Overall Performance
            </h2>
            <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {summary.correct}/{summary.total}
            </span>
          </div>
          <ProgressBar
            label="Score"
            progress={summary.accuracy}
            color="green"
            showLabel={true}
          />
        </div>

        <div className="mb-8 animate-fade-in-up rounded-2xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-2xl font-bold text-gray-800 dark:text-white">
            📊 Practice Information
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              {
                label: "Subject",
                value: reportData.practice.subject,
                className: "bg-blue-50 dark:bg-blue-900/20 border-blue-500",
              },
              {
                label: "Mode",
                value: reportData.practice.mode,
                className:
                  "bg-purple-50 dark:bg-purple-900/20 border-purple-500",
              },
              {
                label: "Answered",
                value: `${summary.answered} / ${summary.total}`,
                className: "bg-green-50 dark:bg-green-900/20 border-green-500",
              },
              {
                label: "Unanswered",
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

        <div className="mb-8 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 animate-fade-in-up">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
            📈 Performance by Difficulty
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  className={`bg-gradient-to-br ${bgGradient} rounded-xl p-5 border-2 hover:shadow-lg transition-all duration-300`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-gray-800 dark:text-white text-lg">
                      {difficulty}
                    </span>
                    <Chip
                      size="lg"
                      color={accentColor}
                      className="font-bold text-lg px-3"
                    >
                      {stat.accuracy}%
                    </Chip>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 font-semibold">
                    ✓ {stat.correct} / {stat.total} correct
                  </p>
                  <div className="mt-3 bg-white/50 dark:bg-gray-900/30 rounded-full h-2 overflow-hidden">
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

        <div className="mb-8 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 animate-fade-in-up">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
            🎯 Performance by Domain
          </h2>
          <div className="space-y-4">
            {reportData.domains.map((domain, idx) => (
              <div key={domain.domain} className="group">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-800 dark:text-white text-sm md:text-base">
                    {idx + 1}. {domain.domain}
                  </span>
                  <span className="text-sm font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                    {domain.correct}/{domain.total} ({domain.accuracy}%)
                  </span>
                </div>
                <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
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

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in-up">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 md:px-8 py-4 md:py-6">
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              📋 Question Details & Review
            </h2>
            <p className="text-blue-100 text-sm mt-1">
              Review each question with all options, your answer, and the
              correct answer
            </p>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {questions.map((q, idx) => {
              const userAnswerDisplay = getAnswerText(q.selectedAnswer);
              const correctAnswerDisplay = getAnswerText(q.correctAnswer);

              return (
                <div
                  key={q.questionId}
                  className="p-4 md:p-6 transition-all duration-200 ..."
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-default-100 dark:border-default-800">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center min-w-[40px] h-8 px-3 rounded-lg bg-gradient-to-br from-primary to-primary-600 font-bold text-sm shadow-sm shadow-primary/20">
                          Q{q.number}
                        </span>
                      </div>

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
                          className="font-bold text-[10px]"
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
                        className="font-medium text-[14px] text-default-500 dark:text-default-400"
                      >
                        {q.type === "MCQ"
                          ? "📝 Multiple Choice"
                          : q.type === "GRID_IN"
                            ? "🔢 Grid-in"
                            : "📄 Text"}
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
                      className="font-bold shadow-sm gap-1.5 pl-2.5"
                    >
                      {q.isCorrect ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Xmark className="w-3.5 h-3.5" />
                      )}
                    </Chip>
                  </div>
                  <div className="mb-3">
                    <p className="text-gray-800 dark:text-white font-medium leading-relaxed">
                      <MathText text={q.prompt || "—"} />
                    </p>
                    {q.passage && (
                      <details className="mt-2">
                        <summary className="text-sm font-semibold text-blue-600 cursor-pointer hover:underline">
                          📖 Show Passage
                        </summary>
                        <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed prose prose-sm max-w-none">
                          {parse(q.passage)}
                        </div>
                      </details>
                    )}
                  </div>

                  {q.options && q.options.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        All Options
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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
                                <span className="font-semibold text-gray-600 dark:text-gray-400 min-w-[24px]">
                                  {opt.label}.
                                </span>
                                <span className="flex-1 text-gray-800 dark:text-white">
                                  <MathText text={opt.content} />
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-xs">
                                {isSelected && (
                                  <span className="font-bold text-blue-600 dark:text-blue-400">
                                    (Your choice)
                                  </span>
                                )}
                                {isCorrect && (
                                  <span className="font-bold text-green-600 dark:text-green-400">
                                    ✓ Correct
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                      <div
                        className={`rounded-lg p-3 border-2 ${q.isCorrect
                            ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                            : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
                          }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            Your Answer
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

                      <div className="rounded-lg p-3 border-2 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            Correct Answer
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
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
                        💡 Explanation
                      </p>
                      <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                        <MathText text={q.explanation} />
                      </div>
                    </div>
                  )}

                  {q.proTips && (
                    <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
                      <p className="text-sm font-semibold text-primary">
                        💡 Pro Tip
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
