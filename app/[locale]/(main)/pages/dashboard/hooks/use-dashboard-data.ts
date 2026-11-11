"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";

import type {
  TestHistory as FullTestHistory,
  TestHistory,
} from "@/app/components/history/type";

export interface PracticeHistory {
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
  mode: string;
  status: string;
}

function extractSessions(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  if (payload.data && typeof payload.data === "object") {
    if (Array.isArray(payload.data.sessions)) return payload.data.sessions;
    if (Array.isArray(payload.data.history)) return payload.data.history;
    if (Array.isArray(payload.data.data)) return payload.data.data;
    if (Array.isArray(payload.data.items)) return payload.data.items;
    if (Array.isArray(payload.data)) return payload.data;
  }

  if (Array.isArray(payload.sessions)) return payload.sessions;
  if (Array.isArray(payload.history)) return payload.history;

  return [];
}

function mapSessionToHistory(raw: any): TestHistory {
  const summary = raw?.summary ?? {};

  const correct = Number(
    raw?.correct ??
      raw?.totalCorrect ??
      summary?.correct ??
      summary?.totalCorrect ??
      0,
  );
  const incorrect = Number(
    raw?.incorrect ??
      raw?.totalWrong ??
      summary?.incorrect ??
      summary?.totalWrong ??
      0,
  );
  const unanswered = Number(
    raw?.unanswered ??
      raw?.totalSkipped ??
      summary?.unanswered ??
      summary?.totalSkipped ??
      0,
  );

  const sections = Array.isArray(raw?.sections) ? raw.sections : [];
  let computedTotal = 0;
  let computedCorrect = 0;
  let computedIncorrect = 0;
  let computedAnswered = 0;

  for (const s of sections) {
    computedTotal += Number(s?.total ?? s?.totalQuestions ?? 0);
    computedCorrect += Number(s?.correct ?? s?.correctAnswers ?? 0);

    const incorrectFromDiff =
      s?.answered != null && s?.correct != null
        ? Math.max(0, Number(s.answered) - Number(s.correct))
        : 0;

    computedIncorrect += Number(
      s?.incorrect ?? s?.wrongAnswers ?? incorrectFromDiff,
    );
    computedAnswered += Number(s?.answered ?? s?.answeredQuestions ?? 0);
  }

  const finalCorrect = correct > 0 ? correct : computedCorrect;
  const finalIncorrect = incorrect > 0 ? incorrect : computedIncorrect;

  const totalQuestions = Number(
    raw?.totalQuestions ??
      raw?.total ??
      summary?.total ??
      summary?.totalQuestions ??
      (computedTotal > 0
        ? computedTotal
        : finalCorrect + finalIncorrect + unanswered),
  );

  const answeredQuestions = Number(
    raw?.answered ??
      raw?.answeredQuestions ??
      summary?.answered ??
      (computedAnswered > 0 ? computedAnswered : finalCorrect + finalIncorrect),
  );

  /* ── FIX: accuracy = correct/answered, đọc raw trước, compute fallback ── */
  const rawAccuracy = Number(raw?.accuracy ?? summary?.accuracy ?? NaN);
  const accuracy =
    Number.isFinite(rawAccuracy) && rawAccuracy >= 0
      ? Math.round(rawAccuracy * 100) / 100
      : answeredQuestions > 0
        ? Number(((finalCorrect / answeredQuestions) * 100).toFixed(2))
        : 0;

  const examTitle =
    raw?.exam?.title ?? raw?.section?.title ?? raw?.examTitle ?? "Full Test";

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
    answeredQuestions,
    totalCorrect: finalCorrect,
    totalWrong: finalIncorrect,
    totalSkipped:
      unanswered > 0 ? unanswered : totalQuestions - answeredQuestions,
    accuracy,
    rawScore: raw?.rawScore ?? summary?.rawScore ?? null,
    scaledScore:
      typeof raw?.scaledScore === "number"
        ? raw.scaledScore
        : typeof summary?.scaledScore === "number"
          ? summary.scaledScore
          : null,
    totalTimeSpent: Number(
      raw?.timeSpent ?? raw?.totalTimeSpent ?? summary?.totalTimeSpent ?? 0,
    ),
    sections,
  } as TestHistory;
}

export function useDashboardData(isAuthenticated: boolean, isLoading: boolean) {
  const [practiceHistory, setPracticeHistory] = useState<PracticeHistory[]>([]);
  const [fullTestHistory, setFullTestHistory] = useState<FullTestHistory[]>([]);
  const [mathOnlyHistory, setMathOnlyHistory] = useState<TestHistory[]>([]);
  const [rwOnlyHistory, setRwOnlyHistory] = useState<TestHistory[]>([]);

  const [mathOnlyLoading, setMathOnlyLoading] = useState(true);
  const [rwOnlyLoading, setRwOnlyLoading] = useState(true);
  const [practiceLoading, setPracticeLoading] = useState(true);
  const [fullTestLoading, setFullTestLoading] = useState(true);

  const fetchMathOnlyHistory = useCallback(async () => {
    if (!isAuthenticated) {
      setMathOnlyLoading(false);
      return;
    }
    try {
      setMathOnlyLoading(true);
      const res = await axios.get("/api/math-module-test/history", {
        withCredentials: true,
      });

      const sessions = extractSessions(res.data);
      const mapped = sessions.map(mapSessionToHistory);
      setMathOnlyHistory(mapped.slice(0, 5));
    } catch (err) {
      console.error("[Math history] failed:", err);
      setMathOnlyHistory([]);
    } finally {
      setMathOnlyLoading(false);
    }
  }, [isAuthenticated]);

  const fetchRWOnlyHistory = useCallback(async () => {
    if (!isAuthenticated) {
      setRwOnlyLoading(false);
      return;
    }
    try {
      setRwOnlyLoading(true);
      const res = await axios.get("/api/rw-module-test/history", {
        withCredentials: true,
      });

      const sessions = extractSessions(res.data);
      const mapped = sessions.map(mapSessionToHistory);
      setRwOnlyHistory(mapped.slice(0, 5));
    } catch (err) {
      console.error("[RW history] failed:", err);
      setRwOnlyHistory([]);
    } finally {
      setRwOnlyLoading(false);
    }
  }, [isAuthenticated]);

  const fetchPracticeHistory = useCallback(async () => {
    if (!isAuthenticated) {
      setPracticeLoading(false);
      return;
    }
    try {
      setPracticeLoading(true);
      const res = await axios.get("/api/practice/history", {
        withCredentials: true,
      });

      const sessions = extractSessions(res.data);
      const mapped: PracticeHistory[] = sessions.map((raw: any) => ({
        id: raw?.id ?? "",
        subject: raw?.subject ?? "",
        domain: raw?.domain ?? null,
        subtopic: raw?.subtopic ?? null,
        totalQuestions: Number(raw?.totalQuestions ?? raw?.total ?? 0),
        correctAnswers: Number(
          raw?.correctAnswers ?? raw?.correct ?? raw?.totalCorrect ?? 0,
        ),
        score: typeof raw?.score === "number" ? raw.score : null,
        timeSpent: Number(raw?.timeSpent ?? raw?.totalTimeSpent ?? 0),
        startedAt: raw?.startedAt ?? new Date().toISOString(),
        completedAt: raw?.completedAt ?? null,
        mode: raw?.mode ?? "practice",
        status: raw?.status ?? "IN_PROGRESS",
      }));

      setPracticeHistory(mapped.slice(0, 5));
    } catch (err) {
      console.error("[Practice history] failed:", err);
      setPracticeHistory([]);
    } finally {
      setPracticeLoading(false);
    }
  }, [isAuthenticated]);

  /* FIX: dùng extractSessions + mapSessionToHistory */
  const fetchFullTestHistory = useCallback(async () => {
    if (!isAuthenticated) {
      setFullTestLoading(false);
      return;
    }
    try {
      setFullTestLoading(true);
      const res = await axios.get("/api/full-test/history", {
        withCredentials: true,
      });

      const sessions = extractSessions(res.data);
      const mapped = sessions.map(mapSessionToHistory);
      setFullTestHistory(mapped.slice(0, 5));
    } catch (err) {
      console.error("[Full test history] failed:", err);
      setFullTestHistory([]);
    } finally {
      setFullTestLoading(false);
    }
  }, [isAuthenticated]);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    await Promise.all([
      fetchPracticeHistory(),
      fetchFullTestHistory(),
      fetchMathOnlyHistory(),
      fetchRWOnlyHistory(),
    ]);
  }, [
    isAuthenticated,
    fetchPracticeHistory,
    fetchFullTestHistory,
    fetchMathOnlyHistory,
    fetchRWOnlyHistory,
  ]);

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    void refresh();
  }, [isLoading, isAuthenticated, refresh]);

  useEffect(() => {
    const handlePageShow = () => {
      if (!isAuthenticated) return;
      void refresh();
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [isAuthenticated, refresh]);

  return {
    practiceHistory,
    fullTestHistory,
    mathOnlyHistory,
    rwOnlyHistory,
    practiceLoading,
    fullTestLoading,
    mathOnlyLoading,
    rwOnlyLoading,
    refresh,
  };
}
