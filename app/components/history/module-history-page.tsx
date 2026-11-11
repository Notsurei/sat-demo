"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useTranslations } from "next-intl";
import {
  ChartColumn,
  BookOpen,
  Check,
  ChartColumnStacked,
  Cup,
} from "@gravity-ui/icons";

import { useAuthStore } from "@/zustand/auth-store";
import { useRouter } from "@/i18n/navigation";
import SummaryCard from "@/app/components/history/summary-card";

import type { TestHistory } from "./type";
import ModuleHistoryList from "./module-history-list";

interface ModuleHistoryPageProps {
  subject: "SAT_MATH" | "SAT_RW";
  subjectLabel: string;
  apiPath: string;
  sessionPath: string;
  reportPath: string;
  titleKey: "math" | "rw";
}

interface ApiResponse {
  success: boolean;
  data?: {
    sessions?: TestHistory[];
    history?: TestHistory[];
  } | TestHistory[];
  history?: TestHistory[];
}

function extractSessions(payload: any): TestHistory[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  if (payload.data && typeof payload.data === "object") {
    if (!Array.isArray(payload.data)) {
      if (Array.isArray(payload.data.sessions)) return payload.data.sessions;
      if (Array.isArray(payload.data.history)) return payload.data.history;
      if (Array.isArray(payload.data.data)) return payload.data.data;
    } else {
      return payload.data;
    }
  }

  if (Array.isArray(payload.sessions)) return payload.sessions;
  if (Array.isArray(payload.history)) return payload.history;

  return [];
}

function mapSessionToHistory(raw: any): TestHistory {
  const correct = Number(raw?.correct ?? raw?.totalCorrect ?? 0);
  const incorrect = Number(raw?.incorrect ?? raw?.totalWrong ?? 0);
  const unanswered = Number(raw?.unanswered ?? raw?.totalSkipped ?? 0);
  const totalQuestions = Number(
    raw?.totalQuestions ?? correct + incorrect + unanswered,
  );

  const examTitle =
    raw?.section?.title ?? raw?.exam?.title ?? raw?.examTitle ?? "Module";

  return {
    id: raw?.id ?? "",
    examId: raw?.examId ?? raw?.exam?.id ?? "",
    examTitle,
    status: raw?.status ?? "IN_PROGRESS",
    subject: raw?.section?.subject ?? raw?.subject ?? undefined,
    moduleNumber: raw?.section?.moduleNumber ?? null,
    variant: raw?.section?.variant ?? null,
    startedAt: raw?.startedAt ?? new Date().toISOString(),
    completedAt: raw?.completedAt ?? null,
    totalQuestions,
    answeredQuestions: Number(raw?.answered ?? correct + incorrect),
    totalCorrect: correct,
    totalWrong: incorrect,
    totalSkipped: unanswered,
    rawScore: raw?.rawScore ?? null,
    scaledScore: raw?.scaledScore ?? null,
    totalTimeSpent: Number(raw?.timeSpent ?? raw?.totalTimeSpent ?? 0),
    sections: [],
  } as TestHistory;
}

export default function ModuleHistoryPage({
  subject,
  subjectLabel,
  apiPath,
  sessionPath,
  reportPath,
  titleKey,
}: ModuleHistoryPageProps) {
  const router = useRouter();
  const t = useTranslations("moduleReportCommon");

  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  const [history, setHistory] = useState<TestHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;

    let cancelled = false;

    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await axios.get<ApiResponse>(apiPath, {
          withCredentials: true,
        });

        if (cancelled) return;

        const sessions = extractSessions(res.data);
        const mapped = sessions.map(mapSessionToHistory);
        setHistory(mapped);
      } catch (err: any) {
        if (cancelled) return;
        console.error("[ModuleHistoryPage] Failed:", err);
        setError(
          err.response?.data?.error ??
          err.response?.data?.message ??
          t("loadFailed"),
        );
        setHistory([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchHistory();
    return () => {
      cancelled = true;
    };
  }, [isLoading, isAuthenticated, apiPath, t]);

  if (isLoading || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm leading-relaxed text-slate-500">
          {t("loadingHistory")}
        </p>
      </main>
    );
  }

  if (!isAuthenticated) return null;

  const isMath = subject === "SAT_MATH";
  const Icon = isMath ? ChartColumn : BookOpen;

  const completed = history.filter((x) => x.status === "COMPLETED");

  const totalQuestions = completed.reduce(
    (s, x) => s + (x.totalQuestions ?? 0),
    0,
  );
  const totalCorrect = completed.reduce(
    (s, x) => s + (x.totalCorrect ?? 0),
    0,
  );

  const averageAccuracy =
    totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  const scoredTests = completed.filter((x) => x.scaledScore != null);
  const averageScaledScore =
    scoredTests.length > 0
      ? Math.round(
        scoredTests.reduce((s, x) => s + (x.scaledScore ?? 0), 0) /
        scoredTests.length,
      )
      : null;

  const summaryCards = [
    {
      icon: <Icon width={20} />,
      label: `${subjectLabel} Sessions`,
      value: history.length,
      description: "Total sessions",
      iconClass: isMath
        ? "bg-orange-500/10 text-orange-500"
        : "bg-red-500/10 text-red-500",
    },
    {
      icon: <Check width={20} />,
      label: "Completed",
      value: completed.length,
      description: "Finished sessions",
      iconClass: "bg-success/10 text-success",
    },
    {
      icon: <ChartColumnStacked width={20} />,
      label: "Accuracy",
      value: `${averageAccuracy}%`,
      description: "Across all questions",
      iconClass: "bg-warning/10 text-warning",
    },
    {
      icon: <Cup width={20} />,
      label: "Avg. Score",
      value: averageScaledScore !== null ? averageScaledScore : "N/A",
      description: "Scaled score (200–800)",
      iconClass: "bg-secondary/10 text-secondary",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
        <section className="mb-8">
          <p
            className={`text-sm font-semibold ${isMath ? "text-orange-600" : "text-red-600"
              }`}
          >
            {t("brand")}
          </p>

          <h1 className="mt-1 text-3xl font-bold leading-tight tracking-tight text-slate-900">
            {t(`titles.history.${titleKey}`)}
          </h1>

          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            {t(`subtitles.history.${titleKey}`)}
          </p>
        </section>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-700">⚠️ {error}</p>
          </div>
        )}

        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {summaryCards.map((item, index) => (
            <SummaryCard
              key={index}
              icon={item.icon}
              label={item.label}
              value={item.value}
              description={item.description}
              iconClass={item.iconClass}
            />
          ))}
        </section>

        <section className="mt-8">
          <div className="mb-5">
            <h2 className="text-xl font-bold leading-tight text-slate-900">
              {t("sessions.title")}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-500">
              {t("sessions.subtitle")}
            </p>
          </div>

          <ModuleHistoryList
            tests={history}
            subjectLabel={subjectLabel}
            onAction={(test) => {
              if (test.status === "IN_PROGRESS") {
                router.push(`${sessionPath}/${test.id}`);
                return;
              }

              if (test.status === "COMPLETED") {
                router.push(`${reportPath}/${test.id}`);
              }
            }}
          />
        </section>
      </div>
    </main>
  );
}