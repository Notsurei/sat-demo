"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

import { useAuthStore } from "@/zustand/auth-store";

import HistorySummary from "./components/history-summary";
import PracticeHistoryList from "./components/practice-history-list";

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

interface ApiResponse {
  success: boolean;
  data: Practice[];
}

export default function HistoryPage() {
  const router = useRouter();

  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  const [history, setHistory] = useState<Practice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      await checkAuth();
    };
    initialize();
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
          "/api/practice/history",
          {
            withCredentials: true,
          },
        );

        setHistory(response.data.data || []);
      } catch (error) {
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-500">Loading practice history...</p>
      </main>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const completedPractices = history.filter(
    (practice) => practice.status === "DONE",
  );

  const totalQuestions = completedPractices.reduce(
    (sum, practice) => sum + practice.totalQuestions,
    0,
  );

  const totalCorrect = completedPractices.reduce(
    (sum, practice) => sum + practice.correctAnswers,
    0,
  );

  const averageAccuracy =
    totalQuestions > 0
      ? Math.round((totalCorrect / totalQuestions) * 100)
      : 0;

  const scoredPractices = completedPractices.filter(
    (practice) => practice.score !== null && practice.score !== undefined,
  );

  const averageScore =
    scoredPractices.length > 0
      ? Math.round(
        scoredPractices.reduce(
          (sum, practice) => sum + (practice.score ?? 0),
          0,
        ) / scoredPractices.length,
      )
      : null;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
        <section className="mb-8">
          <p className="text-sm font-semibold text-primary">StudyBuddy</p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Practice History
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Review your practice sessions and track your progress over time.
          </p>
        </section>

        <HistorySummary
          totalPractices={history.length}
          completedPractices={completedPractices.length}
          averageAccuracy={averageAccuracy}
          averageScore={averageScore}
        />

        <section className="mt-8">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-900">
              Practice Sessions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your latest practice activity.
            </p>
          </div>

          <PracticeHistoryList
            practices={history}
            onAction={(practice) => {
              if (practice.status === "IN_PROGRESS") {
                router.push(`/practice/${practice.id}`);
                return;
              }

              if (practice.status === "DONE") {
                router.push(`/pages/practice-report/${practice.id}`);
              }
            }}
          />
        </section>
      </div>
    </main>
  );
}