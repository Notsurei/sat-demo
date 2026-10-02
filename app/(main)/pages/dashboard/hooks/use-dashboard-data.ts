"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";

import { FullTestHistory } from "@/app/(main)/pages/full-test-report-history/components/type";

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

export function useDashboardData(isAuthenticated: boolean, isLoading: boolean) {
  const [practiceHistory, setPracticeHistory] = useState<PracticeHistory[]>(
    [],
  );

  const [practiceLoading, setPracticeLoading] = useState(true);

  const [fullTestHistory, setFullTestHistory] = useState<FullTestHistory[]>(
    [],
  );

  const [fullTestLoading, setFullTestLoading] = useState(true);

  const fetchPracticeHistory = useCallback(async () => {
    if (!isAuthenticated) {
      setPracticeLoading(false);
      return;
    }

    try {
      setPracticeLoading(true);

      const response = await axios.get("/api/practice/history", {
        withCredentials: true,
      });

      const data = response.data;

      if (!data?.success || !Array.isArray(data.data)) {
        setPracticeHistory([]);
        return;
      }

      setPracticeHistory(data.data.slice(0, 5));
    } catch (error) {
      console.error("Failed to fetch practice history:", error);
      setPracticeHistory([]);
    } finally {
      setPracticeLoading(false);
    }
  }, [isAuthenticated]);

  const fetchFullTestHistory = useCallback(async () => {
    if (!isAuthenticated) {
      setFullTestLoading(false);
      return;
    }

    try {
      setFullTestLoading(true);

      const response = await axios.get("/api/full-test/history", {
        withCredentials: true,
      });

      const data = response.data;

      if (!data?.success || !Array.isArray(data.data)) {
        setFullTestHistory([]);
        return;
      }

      setFullTestHistory(data.data.slice(0, 5));
    } catch (error) {
      console.error("Failed to fetch full test history:", error);
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
    ]);
  }, [
    isAuthenticated,
    fetchPracticeHistory,
    fetchFullTestHistory,
  ]);

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;

    void refresh();
  }, [isLoading, isAuthenticated, refresh]);

  /*
   * Browser Back / Forward / bfcache
   */
  useEffect(() => {
    const handlePageShow = () => {
      if (!isAuthenticated) return;

      void refresh();
    };

    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [isAuthenticated, refresh]);

  return {
    practiceHistory,
    fullTestHistory,

    practiceLoading,
    fullTestLoading,

    refresh,
  };
}

