"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { Button, Chip } from "@heroui/react";
import { Check, Clock, TargetDart, Xmark } from "@gravity-ui/icons";
import { useAuthStore } from "@/zustand/auth-store";
import MathText from "@/app/components/LaText/MathJax";
import ProgressBar from "@/app/components/progress-bar/progress-bar";
import parse from "html-react-parser";

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

interface ReportQuestion {
  number: number;
  questionId: string;
  externalId?: string | null;

  subject?: string;
  sectionId?: string;
  sectionTitle?: string;
  sectionOrder?: number;

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
  isFlagged?: boolean;

  answeredAt?: string | null;
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

interface SectionStat {
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
  durationSeconds: number;

  startedAt?: string | null;
  completedAt?: string | null;

  questions: ReportQuestion[];
}

interface FullTestReportData {
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
    version?: string | null;
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

  scores?: {
    total?: number | null;
    readingWriting?: number | null;
    math?: number | null;
  };

  sections: SectionStat[];

  difficulty: {
    EASY: DifficultyStat;
    MEDIUM: DifficultyStat;
    HARD: DifficultyStat;
  };

  domains: DomainStat[];

  questions: ReportQuestion[];
}

/* ------------------------------------------------------------------ */
/*  SAT SCALE CONSTANTS                                                */
/* ------------------------------------------------------------------ */
const SAT_SECTION_MIN = 200;
const SAT_SECTION_MAX = 800;
const SAT_TOTAL_MIN = 400;
const SAT_TOTAL_MAX = 1600;

const SAT_RW_MAX_RAW = 54; // 27 M1 + 27 M2
const SAT_MATH_MAX_RAW = 44; // 22 M1 + 22 M2

/* ------------------------------------------------------------------ */
/*  OFFICIAL SAT CONVERSION TABLES (piecewise linear)                  */
/* ------------------------------------------------------------------ */
const RW_SCALE_HARD: ReadonlyArray<readonly [number, number]> = [
  [0, 200],
  [3, 230],
  [6, 260],
  [9, 290],
  [12, 320],
  [15, 360],
  [18, 390],
  [21, 420],
  [24, 460],
  [27, 490],
  [30, 520],
  [33, 550],
  [36, 580],
  [39, 610],
  [42, 640],
  [44, 660],
  [46, 680],
  [48, 710],
  [50, 740],
  [52, 770],
  [53, 790],
  [54, 800],
];

const RW_SCALE_EASY: ReadonlyArray<readonly [number, number]> = [
  [0, 200],
  [3, 220],
  [6, 250],
  [9, 270],
  [12, 300],
  [15, 330],
  [18, 360],
  [21, 390],
  [24, 410],
  [27, 430],
  [30, 450],
  [33, 470],
  [36, 490],
  [39, 510],
  [42, 530],
  [44, 550],
  [46, 570],
  [48, 590],
  [50, 610],
  [52, 630],
  [54, 650],
];

const MATH_SCALE_HARD: ReadonlyArray<readonly [number, number]> = [
  [0, 200],
  [2, 230],
  [4, 260],
  [6, 290],
  [8, 320],
  [10, 350],
  [12, 380],
  [14, 410],
  [16, 440],
  [18, 470],
  [20, 500],
  [22, 530],
  [24, 560],
  [26, 590],
  [28, 620],
  [30, 650],
  [32, 680],
  [34, 710],
  [36, 740],
  [38, 760],
  [40, 780],
  [42, 790],
  [43, 795],
  [44, 800],
];

const MATH_SCALE_EASY: ReadonlyArray<readonly [number, number]> = [
  [0, 200],
  [2, 220],
  [4, 240],
  [6, 260],
  [8, 280],
  [10, 300],
  [12, 325],
  [14, 350],
  [16, 375],
  [18, 400],
  [20, 420],
  [22, 445],
  [24, 465],
  [26, 480],
  [28, 500],
  [30, 515],
  [32, 530],
  [34, 545],
  [36, 560],
  [38, 575],
  [40, 590],
  [42, 610],
  [44, 630],
];

/* ------------------------------------------------------------------ */
/*  HELPERS                                                            */
/* ------------------------------------------------------------------ */
const isRwSubject = (subject?: string | null) => {
  const s = (subject ?? "").toUpperCase();
  return s === "SAT_RW" || s.includes("RW") || s.includes("READING");
};

const isMathSubject = (subject?: string | null) => {
  const s = (subject ?? "").toUpperCase();
  return s === "SAT_MATH" || s.includes("MATH");
};

const isHardPath = (sections: SectionStat[]): boolean => {
  return sections.some((s) => {
    const t = (s.title ?? "").toLowerCase();
    return t.includes("hard") || t.includes("advanced");
  });
};

interface SectionAggregate {
  total: number;
  correct: number;
  answered: number;
  accuracy: number;
}

const aggregateSections = (sections: SectionStat[]): SectionAggregate => {
  const total = sections.reduce((sum, s) => sum + s.total, 0);
  const correct = sections.reduce((sum, s) => sum + s.correct, 0);
  const answered = sections.reduce((sum, s) => sum + s.answered, 0);
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  return { total, correct, answered, accuracy };
};

/**
 * Interpolate raw → scaled trên bảng piecewise linear.
 */
const rawToScaled = (
  raw: number,
  table: ReadonlyArray<readonly [number, number]>,
): number => {
  if (raw <= table[0][0]) return table[0][1];
  const last = table[table.length - 1];
  if (raw >= last[0]) return last[1];

  for (let i = 1; i < table.length; i++) {
    if (raw <= table[i][0]) {
      const [x0, y0] = table[i - 1];
      const [x1, y1] = table[i];
      const t = (raw - x0) / (x1 - x0);
      return Math.round(y0 + t * (y1 - y0));
    }
  }
  return last[1];
};

/**
 * Tính scaled score cho 1 section (200–800) theo bảng SAT.
 * - Normalize correct về thang raw chuẩn (54 cho RW, 44 cho Math).
 * - Round về bội số của 10 (chuẩn SAT).
 */
const computeSectionScaled = (
  subject: "RW" | "MATH",
  correct: number,
  total: number,
  hard: boolean,
): number => {
  if (total === 0) return SAT_SECTION_MIN;

  const maxRaw = subject === "RW" ? SAT_RW_MAX_RAW : SAT_MATH_MAX_RAW;
  const normalizedRaw =
    total === maxRaw ? correct : Math.round((correct / total) * maxRaw);

  const table =
    subject === "RW"
      ? hard
        ? RW_SCALE_HARD
        : RW_SCALE_EASY
      : hard
        ? MATH_SCALE_HARD
        : MATH_SCALE_EASY;

  const scaled = rawToScaled(normalizedRaw, table);
  const clamped = Math.max(SAT_SECTION_MIN, Math.min(SAT_SECTION_MAX, scaled));
  return Math.round(clamped / 10) * 10;
};

export default function FullTestReportPage() {
  const params = useParams<{
    testId: string;
    sessionId: string;
  }>();

  const router = useRouter();
  const sessionId = params?.sessionId;
  const { checkAuth, isAuthenticated, isLoading } = useAuthStore();
  const [reportData, setReportData] = useState<FullTestReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!sessionId || isLoading || !isAuthenticated) {
      return;
    }

    let cancelled = false;

    const fetchReport = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(
          `/api/full-test/sessions/${sessionId}/result`,
          { withCredentials: true },
        );

        if (cancelled) return;

        if (response.data?.success) {
          setReportData(response.data.data);
        } else {
          setError(
            response.data?.message ||
              response.data?.error ||
              "Failed to load full test report",
          );
        }
      } catch (err: any) {
        if (cancelled) return;

        setError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            "Failed to load full test report",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchReport();

    return () => {
      cancelled = true;
    };
  }, [sessionId, isLoading, isAuthenticated]);

  const handleGoHome = () => {
    router.push("/pages/home");
  };

  const formatTime = (seconds?: number | null) => {
    if (seconds === null || seconds === undefined || seconds <= 0) {
      return "—";
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  const getAnswerText = (answer: AnswerDisplay | null | undefined): string => {
    if (!answer) return "—";
    if (answer.text?.trim()) return answer.text;
    if (answer.label) return answer.label;
    if (answer.content) return answer.content;
    return "—";
  };

  const getSubjectName = (subject?: string) => {
    switch (subject) {
      case "SAT_RW":
        return "Reading & Writing";
      case "SAT_MATH":
        return "Math";
      case "SAT_PRECALCULUS":
        return "Precalculus";
      default:
        return subject || "Full Test";
    }
  };

  const getDifficultyColor = (difficulty?: string | null) => {
    switch (difficulty) {
      case "EASY":
        return "success";
      case "MEDIUM":
        return "warning";
      case "HARD":
        return "danger";
      default:
        return "default";
    }
  };

  const getDifficultyEmoji = (difficulty?: string | null) => {
    switch (difficulty) {
      case "EASY":
        return "🟢";
      case "MEDIUM":
        return "🟡";
      case "HARD":
        return "🔴";
      default:
        return "";
    }
  };

  const getQuestionStatus = (question: ReportQuestion) => {
    if (question.isCorrect === true) {
      return { label: "Correct", color: "success" as const };
    }
    if (question.isCorrect === false) {
      return { label: "Incorrect", color: "danger" as const };
    }
    return { label: "Skipped", color: "warning" as const };
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-default-50 p-6 dark:bg-default-900">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="text-default-500">Loading full test report...</span>
        </div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-default-50 p-6 dark:bg-default-900">
        <div className="text-center">
          <p className="mb-4 text-lg font-semibold text-danger">
            ❌ {error || "Report not found"}
          </p>
          <Button variant="primary" onPress={handleGoHome}>
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  /* ── Derive ───────────────────────────────────────────────────── */

  const summary = reportData.summary;
  const questions = reportData.questions;
  const totalTime = reportData.session.totalTimeSpent ?? 0;
  const accuracyValue = Math.min(100, summary.accuracy ?? 0);

  const sortedSections = [...reportData.sections].sort(
    (a, b) => a.order - b.order,
  );

  const rwSections = sortedSections.filter((s) => isRwSubject(s.subject));
  const mathSections = sortedSections.filter((s) => isMathSubject(s.subject));

  const rwM1 = rwSections[0];
  const rwM2 = rwSections[1];
  const mathM1 = mathSections[0];
  const mathM2 = mathSections[1];

  const rwAgg = aggregateSections(rwSections);
  const mathAgg = aggregateSections(mathSections);

  const rwHard = isHardPath(rwSections);
  const mathHard = isHardPath(mathSections);

  /* Section scaled — 200–800 (đúng chuẩn SAT) */
  const rwScore = computeSectionScaled(
    "RW",
    rwAgg.correct,
    rwAgg.total,
    rwHard,
  );
  const mathScore = computeSectionScaled(
    "MATH",
    mathAgg.correct,
    mathAgg.total,
    mathHard,
  );

  /* Total — 400–1600 */
  const totalScore = rwScore + mathScore;

  /* Phân bổ section score (200–800) cho từng module theo tỉ lệ câu đúng
   * trong section. M1 + M2 = section scaled chính xác. */
  const computeModuleContribution = (
    moduleCorrect: number,
    sectionCorrect: number,
    sectionScaled: number,
  ): number => {
    if (sectionCorrect === 0) return 0;
    return Math.round((moduleCorrect / sectionCorrect) * sectionScaled);
  };

  const rwM1Scaled = computeModuleContribution(
    rwM1?.correct ?? 0,
    rwAgg.correct,
    rwScore,
  );
  const rwM2Scaled = computeModuleContribution(
    rwM2?.correct ?? 0,
    rwAgg.correct,
    rwScore,
  );
  const mathM1Scaled = computeModuleContribution(
    mathM1?.correct ?? 0,
    mathAgg.correct,
    mathScore,
  );
  const mathM2Scaled = computeModuleContribution(
    mathM2?.correct ?? 0,
    mathAgg.correct,
    mathScore,
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 md:p-8">
      <div className="mx-auto max-w-6xl">
        {/* HEADER */}
        <div className="mb-8 flex animate-fade-in flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <h1 className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-3xl font-bold text-transparent md:text-5xl">
              Full Test Report
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 md:text-base">
              {reportData.exam.title}
            </p>
          </div>

          <Button
            onPress={handleGoHome}
            className="bg-gradient-to-r from-blue-500 to-purple-500 px-6 font-semibold text-white shadow-md transition-shadow hover:shadow-lg md:px-8"
            size="md"
          >
            ← Back Home
          </Button>
        </div>

        {/* TOP CARDS */}
        <div className="mb-8 grid animate-fade-in-up grid-cols-1 gap-4 md:grid-cols-4">
          {[
            {
              label: "SAT Score",
              value: `${totalScore}`,
              suffix: `/ ${SAT_TOTAL_MAX}`,
              icon: <TargetDart />,
              className: "from-blue-400 to-purple-600",
              valueClassName: "text-4xl",
            },
            {
              label: "Accuracy",
              value: `${accuracyValue}%`,
              suffix: "",
              icon: <TargetDart />,
              className: "from-green-400 to-emerald-600",
              valueClassName: "text-4xl",
            },
            {
              label: "Correct",
              value: summary.correct,
              suffix: `/ ${summary.total}`,
              icon: <Check />,
              className: "from-blue-400 to-blue-600",
              valueClassName: "text-4xl",
            },
            {
              label: "Time Spent",
              value: formatTime(totalTime),
              suffix: "",
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
                  <div className="mt-2 flex items-baseline gap-1">
                    <p className={`font-bold ${card.valueClassName}`}>
                      {card.value}
                    </p>
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

        {/* OVERALL PERFORMANCE */}
        <div className="mb-8 animate-fade-in-up rounded-2xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-6 flex flex-col items-center justify-between gap-6 md:flex-row">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Overall Performance
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Your SAT performance across both sections
              </p>
            </div>

            <div className="text-center md:text-right">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-5xl font-bold text-transparent">
                {totalScore}
              </div>
              <div className="text-sm font-semibold text-gray-500">
                SAT Score / {SAT_TOTAL_MAX}
              </div>
            </div>
          </div>

          <ProgressBar
            label="Overall Accuracy"
            progress={accuracyValue}
            color="green"
            showLabel={true}
          />

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-800 dark:bg-blue-900/20">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-bold text-gray-800 dark:text-white">
                  Reading & Writing
                </span>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {rwScore}
                  <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                    {" "}
                    / {SAT_SECTION_MAX}
                  </span>
                </span>
              </div>
              {rwAgg.total > 0 && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {rwAgg.correct}/{rwAgg.total} correct · {rwAgg.accuracy}%
                  {rwHard ? " · Hard path" : " · Easy path"}
                </p>
              )}
            </div>

            <div className="rounded-xl border border-purple-200 bg-purple-50 p-5 dark:border-purple-800 dark:bg-purple-900/20">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-bold text-gray-800 dark:text-white">
                  Math
                </span>
                <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {mathScore}
                  <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                    {" "}
                    / {SAT_SECTION_MAX}
                  </span>
                </span>
              </div>
              {mathAgg.total > 0 && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {mathAgg.correct}/{mathAgg.total} correct · {mathAgg.accuracy}
                  %{mathHard ? " · Hard path" : " · Easy path"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* MODULE SCORES */}
        <div className="mb-8 animate-fade-in-up rounded-2xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-2 text-2xl font-bold text-gray-800 dark:text-white">
            🧩 Module Scores
          </h2>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            Each module's contribution to the section scaled score (200–
            {SAT_SECTION_MAX}). M1 + M2 = section score.
          </p>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* R&W CARD */}
            <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-5 dark:border-blue-800 dark:from-blue-900/20 dark:to-cyan-900/20">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-lg font-bold text-gray-800 dark:text-white">
                  Reading & Writing
                </span>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {rwScore}
                  <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                    {" "}
                    / {SAT_SECTION_MAX}
                  </span>
                </span>
              </div>

              <div className="space-y-3">
                {[
                  { label: "Module 1", section: rwM1, scaled: rwM1Scaled },
                  { label: "Module 2", section: rwM2, scaled: rwM2Scaled },
                ].map(({ label, section, scaled }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-lg bg-white/70 px-4 py-3 dark:bg-gray-900/30"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-white">
                        {label}
                        {section?.title?.toLowerCase().includes("hard") && (
                          <span className="ml-2 text-xs font-bold text-red-500">
                            🔥 HARD
                          </span>
                        )}
                        {section?.title?.toLowerCase().includes("easy") && (
                          <span className="ml-2 text-xs font-bold text-emerald-600">
                            🌱 EASY
                          </span>
                        )}
                      </p>
                      {section ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {section.correct}/{section.total} correct ·{" "}
                          {section.accuracy}%
                        </p>
                      ) : (
                        <p className="text-xs italic text-gray-400">
                          Not attempted
                        </p>
                      )}
                    </div>
                    <div className="ml-4 shrink-0 text-right">
                      <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        {scaled}
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                          {" "}
                          pts
                        </span>
                      </p>
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between border-t-2 border-blue-200 pt-3 dark:border-blue-800">
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    Total (both modules)
                  </span>
                  <span className="text-lg font-bold text-blue-700 dark:text-blue-300">
                    {rwScore}
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      {" "}
                      / {SAT_SECTION_MAX}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* MATH CARD */}
            <div className="rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-5 dark:border-purple-800 dark:from-purple-900/20 dark:to-pink-900/20">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-lg font-bold text-gray-800 dark:text-white">
                  Math
                </span>
                <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {mathScore}
                  <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                    {" "}
                    / {SAT_SECTION_MAX}
                  </span>
                </span>
              </div>

              <div className="space-y-3">
                {[
                  { label: "Module 1", section: mathM1, scaled: mathM1Scaled },
                  { label: "Module 2", section: mathM2, scaled: mathM2Scaled },
                ].map(({ label, section, scaled }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-lg bg-white/70 px-4 py-3 dark:bg-gray-900/30"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-white">
                        {label}
                        {section?.title?.toLowerCase().includes("hard") && (
                          <span className="ml-2 text-xs font-bold text-red-500">
                            🔥 HARD
                          </span>
                        )}
                        {section?.title?.toLowerCase().includes("easy") && (
                          <span className="ml-2 text-xs font-bold text-emerald-600">
                            🌱 EASY
                          </span>
                        )}
                      </p>
                      {section ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {section.correct}/{section.total} correct ·{" "}
                          {section.accuracy}%
                        </p>
                      ) : (
                        <p className="text-xs italic text-gray-400">
                          Not attempted
                        </p>
                      )}
                    </div>
                    <div className="ml-4 shrink-0 text-right">
                      <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                        {scaled}
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                          {" "}
                          pts
                        </span>
                      </p>
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between border-t-2 border-purple-200 pt-3 dark:border-purple-800">
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    Total (both modules)
                  </span>
                  <span className="text-lg font-bold text-purple-700 dark:text-purple-300">
                    {mathScore}
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      {" "}
                      / {SAT_SECTION_MAX}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
            <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
              <strong>💡 How it's calculated:</strong> Each section scaled score
              (200–800) uses the official Digital SAT conversion table. Each
              module's contribution is proportional to its share of correct
              answers, so M1 + M2 = section score. Total SAT = R&W + Math →
              400–1600.
            </p>
          </div>
        </div>

        {/* FULL TEST INFORMATION */}
        <div className="mb-8 animate-fade-in-up rounded-2xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-2xl font-bold text-gray-800 dark:text-white">
            📊 Full Test Information
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              {
                label: "Subject",
                value: "Full SAT",
                className: "bg-blue-50 dark:bg-blue-900/20 border-blue-500",
              },
              {
                label: "Questions",
                value: summary.total,
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

        {/* SECTION PERFORMANCE */}
        <div className="mb-8 animate-fade-in-up rounded-2xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-6 text-2xl font-bold text-gray-800 dark:text-white">
            📚 Performance by Section
          </h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {reportData.sections.map((section) => {
              const isRW = isRwSubject(section.subject);
              return (
                <div
                  key={section.id}
                  className={`rounded-xl border-2 p-5 ${
                    isRW
                      ? "border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 dark:border-blue-800 dark:from-blue-900/20 dark:to-cyan-900/20"
                      : "border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 dark:border-purple-800 dark:from-purple-900/20 dark:to-pink-900/20"
                  }`}
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-bold text-gray-800 dark:text-white">
                        {section.title || getSubjectName(section.subject)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {section.total} questions
                      </p>
                    </div>
                    <Chip
                      color={isRW ? "default" : "accent"}
                      size="lg"
                      className="font-bold"
                    >
                      {section.accuracy}%
                    </Chip>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg bg-white/70 p-3 dark:bg-gray-900/30">
                      <p className="text-xs text-gray-500">Correct</p>
                      <p className="mt-1 text-lg font-bold text-green-600">
                        {section.correct}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white/70 p-3 dark:bg-gray-900/30">
                      <p className="text-xs text-gray-500">Incorrect</p>
                      <p className="mt-1 text-lg font-bold text-red-500">
                        {section.incorrect}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white/70 p-3 dark:bg-gray-900/30">
                      <p className="text-xs text-gray-500">Skipped</p>
                      <p className="mt-1 text-lg font-bold text-orange-500">
                        {section.unanswered}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-semibold text-gray-600 dark:text-gray-400">
                        Accuracy
                      </span>
                      <span className="font-bold text-gray-800 dark:text-white">
                        {section.correct}/{section.answered}
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${
                          isRW
                            ? "from-blue-400 to-cyan-500"
                            : "from-purple-400 to-pink-500"
                        } transition-all duration-500`}
                        style={{
                          width: `${Math.min(100, section.accuracy)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>
                      Answered: {section.answered}/{section.total}
                    </span>
                    <span>Time: {formatTime(section.timeSpent)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* DIFFICULTY */}
        <div className="mb-8 animate-fade-in-up rounded-2xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-6 text-2xl font-bold text-gray-800 dark:text-white">
            📈 Performance by Difficulty
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
                      {getDifficultyEmoji(difficulty)} {difficulty}
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
                    ✓ {stat.correct} / {stat.total} correct
                  </p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/50 dark:bg-gray-900/30">
                    <div
                      className={`h-full bg-gradient-to-r ${
                        difficulty === "EASY"
                          ? "from-green-400 to-emerald-500"
                          : difficulty === "MEDIUM"
                            ? "from-yellow-400 to-amber-500"
                            : "from-red-400 to-pink-500"
                      }`}
                      style={{ width: `${Math.min(100, stat.accuracy)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* DOMAIN */}
        <div className="mb-8 animate-fade-in-up rounded-2xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-6 text-2xl font-bold text-gray-800 dark:text-white">
            🎯 Performance by Domain
          </h2>
          <div className="space-y-4">
            {reportData.domains.map((domain, index) => (
              <div key={domain.domain} className="group">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-800 dark:text-white md:text-base">
                    {index + 1}. {domain.domain}
                  </span>
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    {domain.correct}/{domain.answered} answered (
                    {domain.accuracy}%)
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className={`h-full bg-gradient-to-r ${
                      domain.accuracy >= 80
                        ? "from-green-400 to-emerald-500"
                        : domain.accuracy >= 60
                          ? "from-blue-400 to-cyan-500"
                          : domain.accuracy >= 40
                            ? "from-yellow-400 to-amber-500"
                            : "from-red-400 to-pink-500"
                    } transition-all duration-500 ease-out`}
                    style={{ width: `${Math.min(100, domain.accuracy)}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {domain.total} total · {domain.unanswered} unanswered
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* QUESTION REVIEW */}
        <div className="animate-fade-in-up overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4 md:px-8 md:py-6">
            <h2 className="text-2xl font-bold text-white md:text-3xl">
              📋 Question Details & Review
            </h2>
            <p className="mt-1 text-sm text-blue-100">
              Review each question with your answer, correct answer, and
              explanation.
            </p>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {questions.map((question) => {
              const userAnswerDisplay = getAnswerText(question.selectedAnswer);
              const correctAnswerDisplay = getAnswerText(
                question.correctAnswer,
              );
              const status = getQuestionStatus(question);

              return (
                <div
                  key={question.questionId}
                  className="p-4 transition-all duration-200 md:p-6"
                >
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-default-100 pb-3 dark:border-default-800">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex h-8 min-w-[40px] items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-600 px-3 text-sm font-bold shadow-sm shadow-primary/20">
                        Q{question.number}
                      </span>

                      {question.subject && (
                        <Chip
                          size="sm"
                          variant="tertiary"
                          className="font-semibold"
                        >
                          {getSubjectName(question.subject)}
                        </Chip>
                      )}

                      {question.domain && (
                        <span className="text-sm font-semibold text-default-700 dark:text-default-300">
                          {question.domain}
                        </span>
                      )}

                      {question.subtopic && (
                        <>
                          <span className="text-default-300 dark:text-default-600">
                            •
                          </span>
                          <span className="text-sm text-default-500 dark:text-default-400">
                            {question.subtopic}
                          </span>
                        </>
                      )}

                      {question.difficulty && (
                        <Chip
                          size="sm"
                          variant="tertiary"
                          color={getDifficultyColor(question.difficulty)}
                          className="font-bold text-[10px]"
                        >
                          {getDifficultyEmoji(question.difficulty)}{" "}
                          {question.difficulty}
                        </Chip>
                      )}

                      <Chip
                        size="sm"
                        variant="tertiary"
                        className="text-[14px] font-medium text-default-500 dark:text-default-400"
                      >
                        {question.type === "MCQ"
                          ? "📝 Multiple Choice"
                          : question.type === "GRID_IN"
                            ? "🔢 Grid-in"
                            : "📄 Text"}
                      </Chip>

                      <Chip
                        size="sm"
                        variant="tertiary"
                        className="gap-1 font-medium text-[10px] text-default-500"
                      >
                        <Clock className="size-3.5" />
                        {formatTime(question.timeSpent)}
                      </Chip>
                    </div>

                    <Chip
                      size="sm"
                      color={status.color}
                      variant="tertiary"
                      className="gap-1.5 pl-2.5 font-bold shadow-sm"
                    >
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
                          📖 Show Passage
                        </summary>
                        <div className="prose prose-sm mt-2 max-w-none rounded-lg bg-gray-100 p-3 leading-relaxed text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          {parse(question.passage)}
                        </div>
                      </details>
                    )}
                  </div>

                  {question.options && question.options.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        All Options
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
                              className={`flex flex-col gap-1 rounded-lg border p-3 text-sm ${
                                isSelected && isCorrect
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
                                  {option.label}.
                                </span>
                                <span className="flex-1 text-gray-800 dark:text-white">
                                  <MathText text={option.content} />
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

                  {(!question.options || question.options.length === 0) && (
                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div
                        className={`rounded-lg border-2 p-3 ${
                          question.isCorrect === true
                            ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                            : question.isCorrect === false
                              ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
                              : "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20"
                        }`}
                      >
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            Your Answer
                          </span>
                          {question.isCorrect === true && (
                            <Check className="size-4 text-green-600" />
                          )}
                          {question.isCorrect === false && (
                            <Xmark className="size-4 text-red-600" />
                          )}
                          {question.isCorrect === null && (
                            <Clock className="size-4 text-yellow-600" />
                          )}
                        </div>
                        <p className="font-semibold text-gray-800 dark:text-white">
                          {userAnswerDisplay}
                        </p>
                      </div>

                      <div className="rounded-lg border-2 border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            Correct Answer
                          </span>
                          <Check className="size-4 text-green-600" />
                        </div>
                        <p className="font-semibold text-gray-800 dark:text-white">
                          {correctAnswerDisplay}
                        </p>
                      </div>
                    </div>
                  )}

                  {question.explanation && (
                    <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
                      <p className="mb-1 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                        💡 Explanation
                      </p>
                      <div className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                        <MathText text={question.explanation} />
                      </div>
                    </div>
                  )}

                  {question.proTips && (
                    <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
                      <p className="text-sm font-semibold text-primary">
                        💡 Pro Tip
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
            className="bg-gradient-to-r from-blue-500 to-purple-500 px-8 font-semibold text-white shadow-md transition-shadow hover:shadow-lg"
            size="lg"
          >
            ← Back to Home
          </Button>
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
