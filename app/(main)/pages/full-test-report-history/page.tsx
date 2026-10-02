"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

import { useAuthStore } from "@/zustand/auth-store";

import FullTestHistorySummary from "./components/full-test-history-summary";
import FullTestHistoryList from "./components/full-test-history-list";

interface FullTest {
  id: string;
  examId: string;
  examTitle: string;
  status: "IN_PROGRESS" | "BREAK" | "COMPLETED" | "EXPIRED";
  currentSectionOrder: number;
  totalSections: number;
  totalQuestions: number;
  totalCorrect: number;
  totalWrong: number;
  totalSkipped: number;
  rawScore?: number | null;
  scaledScore?: number | null;
  totalTimeSpent?: number | null;
  startedAt: string;
  completedAt?: string | null;
}

interface ApiResponse {
  success: boolean;
  data: FullTest[];
}

export default function FullTestHistoryPage() {
  const router = useRouter();

  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  const [history, setHistory] = useState<FullTest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace("/");
      return;
    }

    const fetchHistory = async () => {
      try {
        setLoading(true);

        const response = await axios.get<ApiResponse>(
          "/api/full-test/history",
          { withCredentials: true },
        );

        setHistory(response.data.data || []);
      } catch (error) {
        console.error("Failed to load full test history:", error);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchHistory();
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-500">
          Loading full test history...
        </p>
      </main>
    );
  }

  if (!isAuthenticated) return null;

  // ============ THỐNG KÊ ============
  const completedTests = history.filter(
    (test) => test.status === "COMPLETED",
  );

  const totalQuestions = completedTests.reduce(
    (sum, test) => sum + test.totalQuestions,
    0,
  );

  const totalCorrect = completedTests.reduce(
    (sum, test) => sum + test.totalCorrect,
    0,
  );

  const averageAccuracy =
    totalQuestions > 0
      ? Math.round((totalCorrect / totalQuestions) * 100)
      : 0;

  const scoredTests = completedTests.filter(
    (test) => test.scaledScore !== null && test.scaledScore !== undefined,
  );

  const averageScaledScore =
    scoredTests.length > 0
      ? Math.round(
          scoredTests.reduce(
            (sum, test) => sum + (test.scaledScore ?? 0),
            0,
          ) / scoredTests.length,
        )
      : null;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <section className="mb-8">
          <p className="text-sm font-semibold text-primary">StudyBuddy</p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Full Test History
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Review your full test sessions and track your SAT progress over
            time.
          </p>
        </section>

        {/* Summary */}
        <FullTestHistorySummary
          totalTests={history.length}
          completedTests={completedTests.length}
          averageAccuracy={averageAccuracy}
          averageScaledScore={averageScaledScore}
        />

        {/* List */}
        <section className="mt-8">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-900">
              Test Sessions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your latest full test activity.
            </p>
          </div>

          <FullTestHistoryList
            tests={history}
            onAction={(test) => {
              // Đang làm dở → continue
              if (
                test.status === "IN_PROGRESS" ||
                test.status === "BREAK"
              ) {
                router.push(
                  `/full-test/${test.examId}/session/${test.id}`,
                );
                return;
              }

              if (test.status === "COMPLETED") {
                router.push(`/pages/full-test-report/${test.id}`);
              }
            }}
          />
        </section>
      </div>
    </main>
  );
}