"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { Button, toast } from "@heroui/react";

import FullTestHeader from "@/app/components/test-page/TestHeader";
import FullTestMain from "@/app/components/test-page/TestBody";
import FullTestFooter from "@/app/components/test-page/TestFooter";
import ConfirmModal from "@/app/components/test-page/confirm-modal";
import TestToolModals from "@/app/components/test-page/test-tools-modal";
import {
  TestLoadingState,
  TestErrorState,
} from "@/app/components/test-page/test-state-display";

import { useFullTestStore } from "@/zustand/full-test-store";
import { useFullTestTimerStore } from "@/zustand/full-test-timer";
import { useTestHeaderAdapter } from "@/config/use-test-header-adapter";
import type { ApiOption, ConfirmConfig } from "@/types/test-page";

const API_BASE = "/api/full-test";

interface ApiQuestion {
  number: number;
  questionId: string;
  subject?: string;
  prompt: string;
  passage?: string | null;
  domain?: string | null;
  subtopic?: string | null;
  difficulty?: string | null;
  type: string;
  options?: ApiOption[];
  selectedAnswer?: { id?: string | null; text?: string | null } | null;
  isFlagged?: boolean;
}

interface ApiSection {
  id: string;
  sectionId: string;
  subject: string;
  title: string;
  order: number;
  duration: number;
  durationSeconds: number;
  variant?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  status?: string;
  questions: ApiQuestion[];
}

interface ApiSessionPayload {
  session: {
    id: string;
    examId: string;
    status: string;
    startedAt: string;
  };
  exam: {
    id: string;
    title: string;
    totalQuestions: number;
    duration: number;
  };
  sections: ApiSection[];
}

interface CompleteResponse {
  success: boolean;
  message?: string;
  data: {
    sectionSessionId: string;
    examSectionId: string;
    section: {
      id: string;
      title: string;
      subject: string;
      order: number;
      moduleNumber: number;
    };
    status: "COMPLETED";
    result: {
      totalQuestions: number;
      answeredQuestions: number;
      unansweredQuestions: number;
      correctAnswers: number;
      incorrectAnswers: number;
      percentage: number;
      earnedWeight: number;
      totalWeight: number;
      weightedPct: number;
    };
    adaptive: {
      variant: "EASY" | "HARD";
      weightedPct: number;
      earnedWeight: number;
      totalWeight: number;
      correctCount: number;
      accuracy: number;
      filledCount: number;
      nextSectionId: string;
    } | null;
    nextSection: {
      id: string;
      sectionSessionId?: string | null;
      title: string;
      subject: string;
      order: number;
      variant: string | null;
    } | null;
    nextSectionOrder: number | null;
    breakInfo: {
      durationSeconds: number;
      startedAt: string;
      endsAt: string;
      nextSectionSessionId: string;
      nextExamSectionId: string;
    } | null;
  };
}

interface BreakState {
  endsAtMs: number;
  durationSeconds: number;
  nextSectionSessionId: string;
  nextExamSectionId: string;
  nextSectionTitle: string;
  nextSectionOrder: number;
}

const sortSections = (sections: ApiSection[]) =>
  sections.slice().sort((a, b) => a.order - b.order);

const buildSectionsForStore = (payload: ApiSessionPayload) =>
  sortSections(payload.sections).map((s) => ({
    id: s.id,
    section: {
      order: s.order,
      subject: s.subject,
      title: s.title,
      duration: Math.round(s.durationSeconds / 60),
      breakAfter: null,
      variant: s.variant ?? null,
    },
    questions: s.questions.map((q) => ({
      question: {
        id: q.questionId,
        prompt: q.prompt,
        type: q.type,
        passage: q.passage ?? null,
        explanation: null,
        options: q.options ?? [],
        difficulty: q.difficulty ?? null,
        domain: q.domain ?? null,
        subtopic: q.subtopic ?? null,
      },
    })),
  }));

type Phase = "RW_M1" | "RW_M2" | "MATH_M1" | "MATH_M2";

function phaseFromOrder(order: number): Phase {
  if (order === 1) return "RW_M1";
  if (order === 2) return "RW_M2";
  if (order === 3) return "MATH_M1";
  return "MATH_M2";
}

export default function TestTakingPage() {
  const params = useParams<{ testId: string; sessionId: string }>();
  const sessionId = params?.sessionId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAnnotator, setShowAnnotator] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showReference, setShowReference] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<ConfirmConfig | null>(
    null,
  );

  const [breakState, setBreakState] = useState<BreakState | null>(null);
  const [breakRemaining, setBreakRemaining] = useState(0);

  const hasAutoSubmittedRef = useRef(false);

  const questionStartRef = useRef<number>(Date.now());
  const prevQuestionIdRef = useRef<string | null>(null);
  const questionTimeMapRef = useRef<Map<string, number>>(new Map());

  // FIX #2: track pending answers
  const pendingAnswersRef = useRef<Set<Promise<unknown>>>(new Set());

  const {
    modules,
    currentModuleIndex,
    currentQuestionIndex,
    answers,
    flaggedQuestions,
    loadFromSession,
    setCurrentModule,
    nextQuestion,
    prevQuestion,
    setOptionAnswer,
    setTextAnswer,
    toggleFlagQuestion,
    goToQuestion,
    flagQuestion,
    reset,
  } = useFullTestStore();

  const { remainingTime, isRunning, tick } = useFullTestTimerStore();

  const { answeredSet, flaggedSet } = useTestHeaderAdapter({
    answers,
    flaggedQuestions,
  });

  const askConfirm = (config: ConfirmConfig) => setConfirmConfig(config);

  const currentModule = modules[currentModuleIndex];
  const currentQuestions = currentModule?.questions ?? [];
  const currentQuestion = currentQuestions[currentQuestionIndex];
  const totalQuestions = currentQuestions.length;
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

  const unansweredCount = currentQuestions.filter((q) => {
    const a = answers[q.id];
    return !a?.optionId && !a?.textAnswer?.trim();
  }).length;

  const isModuleCompleted = isLastQuestion && unansweredCount === 0;

  /* Track per-question time */
  useEffect(() => {
    const prevId = prevQuestionIdRef.current;
    const newId = currentQuestion?.id ?? null;

    if (prevId && prevId !== newId) {
      const elapsed = Math.floor(
        (Date.now() - questionStartRef.current) / 1000,
      );
      const acc = questionTimeMapRef.current.get(prevId) ?? 0;
      questionTimeMapRef.current.set(prevId, acc + elapsed);
    }

    questionStartRef.current = Date.now();
    prevQuestionIdRef.current = newId;
  }, [currentQuestion?.id]);

  const fetchSessionPayload = async (): Promise<ApiSessionPayload | null> => {
    if (!sessionId) return null;
    try {
      const res = await axios.get(
        `${API_BASE}/sessions/${sessionId}/result`,
        { withCredentials: true },
      );
      if (!res.data?.success) return null;
      return res.data.data as ApiSessionPayload;
    } catch {
      return null;
    }
  };

  const applyPayload = (payload: ApiSessionPayload) => {
    loadFromSession({
      examId: payload.session.examId,
      title: payload.exam.title,
      sections: buildSectionsForStore(payload),
    });

    const store = useFullTestStore.getState();
    payload.sections.forEach((s) => {
      s.questions.forEach((q) => {
        if (q.selectedAnswer?.id) {
          store.setOptionAnswer(q.questionId, q.selectedAnswer.id);
        } else if (q.selectedAnswer?.text) {
          store.setTextAnswer(q.questionId, q.selectedAnswer.text);
        }
        if (q.isFlagged) {
          store.flagQuestion(q.questionId);
        }
      });
    });
  };

  /* Init */
  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;

    const init = async () => {
      try {
        setLoading(true);
        setError(null);
        reset();

        const payload = await fetchSessionPayload();
        if (cancelled) return;

        if (!payload) {
          setError("Failed to load session");
          return;
        }

        applyPayload(payload);

        if (payload.session.status === "BREAK") {
          const sorted = sortSections(payload.sections);

          const lastCompleted = sorted
            .filter((s) => s.completedAt)
            .sort((a, b) => b.order - a.order)[0];

          const nextSection = sorted.find(
            (s) => s.order === (lastCompleted?.order ?? 0) + 1,
          );

          if (lastCompleted?.completedAt && nextSection) {
            const BREAK_SECONDS = 600;
            const endsAtMs =
              new Date(lastCompleted.completedAt).getTime() +
              BREAK_SECONDS * 1000;

            setBreakState({
              endsAtMs,
              durationSeconds: BREAK_SECONDS,
              nextSectionSessionId: nextSection.id,
              nextExamSectionId: nextSection.sectionId,
              nextSectionTitle: nextSection.title,
              nextSectionOrder: nextSection.order,
            });
            setBreakRemaining(
              Math.max(0, Math.floor((endsAtMs - Date.now()) / 1000)),
            );

            setLoading(false);
            return;
          }
        }

        const firstSection = sortSections(payload.sections)[0];
        if (firstSection) {
          const totalSec = firstSection.durationSeconds;
          const elapsed = Math.floor(
            (Date.now() - new Date(payload.session.startedAt).getTime()) / 1000,
          );
          const remaining = Math.max(0, totalSec - elapsed);

          useFullTestTimerStore.setState({
            phase: phaseFromOrder(firstSection.order),
            remainingTime: remaining,
            initialTime: totalSec,
            isRunning: true,
            isPaused: false,
          });
        }
      } catch (err: any) {
        if (cancelled) return;
        setError(
          err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to load session",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void init();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  /* FIX #5: timer effect — bỏ breakState khỏi deps */
  useEffect(() => {
    if (!isRunning) return;
    const id = window.setInterval(() => tick(), 1000);
    return () => window.clearInterval(id);
  }, [isRunning, tick]);

  /* Break countdown */
  useEffect(() => {
    if (!breakState) return;

    const tickBreak = () => {
      const remaining = Math.max(
        0,
        Math.floor((breakState.endsAtMs - Date.now()) / 1000),
      );
      setBreakRemaining(remaining);

      if (remaining === 0) {
        void handleStartNextSection();
      }
    };

    tickBreak();
    const id = window.setInterval(tickBreak, 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breakState]);

  /* Auto complete khi hết giờ */
  useEffect(() => {
    if (breakState) return;
    if (
      remainingTime === 0 &&
      !loading &&
      modules.length > 0 &&
      !hasAutoSubmittedRef.current
    ) {
      hasAutoSubmittedRef.current = true;
      toast.warning("Time's up!", { description: "Completing module..." });
      void handleCompleteCurrentSection(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingTime, loading, modules.length, breakState]);

  /* Save answer — có track pending */
  const saveAnswerToServer = async (
    questionId: string,
    payload: {
      optionId?: string | null;
      textAnswer?: string | null;
      isFlagged?: boolean;
    },
  ) => {
    if (!sessionId) return;

    const accumulated = questionTimeMapRef.current.get(questionId) ?? 0;
    const elapsedThisRound =
      questionId === currentQuestion?.id
        ? Math.floor((Date.now() - questionStartRef.current) / 1000)
        : 0;
    const timeSpent = accumulated + elapsedThisRound;

    const promise = axios
      .put(
        `${API_BASE}/sessions/${sessionId}/answers/${questionId}`,
        {
          selectedOptionId: payload.optionId ?? null,
          textAnswer: payload.textAnswer ?? null,
          isFlagged: payload.isFlagged,
          timeSpent,
        },
        { withCredentials: true },
      )
      .catch((err) => {
        console.warn("Save answer failed (ignored):", err);
      })
      .finally(() => {
        pendingAnswersRef.current.delete(promise);
      });

    pendingAnswersRef.current.add(promise);
    await promise;
  };

  const handleOptionSelect = (optionId: string) => {
    if (!currentQuestion) return;
    setOptionAnswer(currentQuestion.id, optionId);
    void saveAnswerToServer(currentQuestion.id, { optionId });
  };

  const handleTextChange = (value: string) => {
    if (!currentQuestion) return;
    setTextAnswer(currentQuestion.id, value);
  };

  const handleTextBlur = () => {
    if (!currentQuestion) return;
    const a = answers[currentQuestion.id];
    void saveAnswerToServer(currentQuestion.id, {
      textAnswer: a?.textAnswer ?? null,
    });
  };

  const handleToggleFlag = () => {
    if (!currentQuestion) return;
    toggleFlagQuestion(currentQuestion.id);
    const nextFlag = !flaggedQuestions[currentQuestion.id];
    void saveAnswerToServer(currentQuestion.id, { isFlagged: nextFlag });
  };

  const flushCurrentTextAnswer = async () => {
    if (!currentQuestion) return;
    if (currentQuestion.type !== "GRID_IN") return;

    const a = answers[currentQuestion.id];
    const text = a?.textAnswer?.trim();
    if (!text) return;

    await saveAnswerToServer(currentQuestion.id, { textAnswer: text });
  };

  const handleNext = () => {
    void flushCurrentTextAnswer();
    nextQuestion();
  };

  const handlePrev = () => {
    void flushCurrentTextAnswer();
    prevQuestion();
  };
  const handleStartNextSection = async () => {
    if (!breakState || !sessionId || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await flushCurrentTextAnswer();

      if (pendingAnswersRef.current.size > 0) {
        await Promise.allSettled(Array.from(pendingAnswersRef.current));
      }

      await axios.post(
        `${API_BASE}/sessions/sections/${breakState.nextSectionSessionId}/start`,
        {},
        { withCredentials: true },
      );

      const payload = await fetchSessionPayload();
      if (!payload) throw new Error("Failed to refresh session");

      applyPayload(payload);

      const sorted = sortSections(payload.sections);
      const idx = sorted.findIndex(
        (s) => s.sectionId === breakState.nextExamSectionId,
      );
      if (idx < 0) throw new Error("Next section not found");

      console.log("[start-next] payload", {
        idx,
        titles: sorted.map((s) => `${s.order}:${s.title}`),
        targetSectionId: breakState.nextExamSectionId,
      });

      /* FIX #3: SET MODULE + QUESTION TRƯỚC */
      setCurrentModule(idx);
      goToQuestion(0);

      questionTimeMapRef.current.clear();
      prevQuestionIdRef.current = null;
      questionStartRef.current = Date.now();
      hasAutoSubmittedRef.current = false;

      const totalSec = sorted[idx].durationSeconds;
      useFullTestTimerStore.setState({
        phase: phaseFromOrder(sorted[idx].order),
        remainingTime: totalSec,
        initialTime: totalSec,
        isRunning: true,
        isPaused: false,
      });

      const s = useFullTestStore.getState();
      console.log("[start-next] store state", {
        currentModuleIndex: s.currentModuleIndex,
        currentQuestionIndex: s.currentQuestionIndex,
        expectedIdx: idx,
      });

      /* FIX #3: clear break CUỐI CÙNG */
      setBreakState(null);
      setBreakRemaining(0);

      toast.success(`Starting ${sorted[idx].title}`, {
        description: "Good luck!",
      });
    } catch (err: any) {
      console.error("Start next section failed:", err);
      toast.danger("Failed to start next section", {
        description:
          err.response?.data?.message || err.message || "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const doCompleteSection = async () => {
    if (!currentModule || !sessionId) return;

    await flushCurrentTextAnswer();

    /* FIX #2: await pending answers trước khi complete */
    if (pendingAnswersRef.current.size > 0) {
      console.log(
        `[complete] Chờ ${pendingAnswersRef.current.size} answer request...`,
      );
      await Promise.allSettled(Array.from(pendingAnswersRef.current));
      console.log("[complete] Flush answers xong");
    }

    /* Flush time câu đang xem */
    if (currentQuestion?.id) {
      const elapsed = Math.floor(
        (Date.now() - questionStartRef.current) / 1000,
      );
      const acc = questionTimeMapRef.current.get(currentQuestion.id) ?? 0;
      questionTimeMapRef.current.set(currentQuestion.id, acc + elapsed);
      questionStartRef.current = Date.now();
    }

    const timerStore = useFullTestTimerStore.getState();
    const wasRunning = timerStore.isRunning;
    const sectionTimeSpent = Math.max(
      0,
      timerStore.initialTime - timerStore.remainingTime,
    );

    try {
      setIsSubmitting(true);
      if (wasRunning) timerStore.pause();

      const res = await axios.post<CompleteResponse>(
        `${API_BASE}/sessions/sections/${currentModule.id}/complete`,
        { timeSpent: sectionTimeSpent },
        { withCredentials: true },
      );

      if (!res.data?.success) {
        throw new Error(res.data?.message || "Complete failed");
      }

      const { nextSection, adaptive, result, breakInfo } = res.data.data;

      if (!nextSection) {
        reset();
        toast.success("Full test completed!", {
          description: result
            ? `Correct ${result.correctAnswers}/${result.totalQuestions} (${result.percentage}%)`
            : undefined,
        });
        window.location.href = `/pages/full-test-report/${sessionId}`;
        return;
      }

      if (breakInfo) {
        setBreakState({
          endsAtMs: new Date(breakInfo.endsAt).getTime(),
          durationSeconds: breakInfo.durationSeconds,
          nextSectionSessionId: breakInfo.nextSectionSessionId,
          nextExamSectionId: breakInfo.nextExamSectionId,
          nextSectionTitle: nextSection.title,
          nextSectionOrder: nextSection.order,
        });
        setBreakRemaining(
          Math.max(
            0,
            Math.floor(
              (new Date(breakInfo.endsAt).getTime() - Date.now()) / 1000,
            ),
          ),
        );
        return;
      }

      const payload = await fetchSessionPayload();
      if (!payload) throw new Error("Failed to refresh session");

      applyPayload(payload);

      const sortedSections = sortSections(payload.sections);
      const nextIdx = sortedSections.findIndex(
        (s) => s.sectionId === nextSection.id,
      );
      if (nextIdx < 0) throw new Error("Next section not found in payload");

      const nextFromPayload = sortedSections[nextIdx];

      setCurrentModule(nextIdx);
      goToQuestion(0);
      hasAutoSubmittedRef.current = false;

      questionTimeMapRef.current.clear();
      prevQuestionIdRef.current = null;
      questionStartRef.current = Date.now();

      const totalSec = nextFromPayload.durationSeconds;
      useFullTestTimerStore.setState({
        phase: phaseFromOrder(nextFromPayload.order),
        remainingTime: totalSec,
        initialTime: totalSec,
        isRunning: true,
        isPaused: false,
      });

      toast.success(`Starting ${nextFromPayload.title}`, {
        description: adaptive
          ? `Adaptive ${adaptive.variant} — ${(
            adaptive.weightedPct * 100
          ).toFixed(0)}% weighted (${adaptive.filledCount} questions)`
          : undefined,
      });
    } catch (err: any) {
      console.error("Section complete failed:", err);
      toast.danger("Failed to complete section", {
        description:
          err.response?.data?.message || err.message || "Please try again.",
      });
      if (wasRunning) timerStore.resume();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteCurrentSection = async (auto = false) => {
    if (!currentModule || !sessionId) return;

    if (auto) {
      await doCompleteSection();
      return;
    }

    const hasUnanswered = unansweredCount > 0;

    askConfirm({
      title: `Complete "${currentModule.title}"?`,
      description: hasUnanswered
        ? `You still have ${unansweredCount} unanswered question${unansweredCount > 1 ? "s" : ""
        }. You won't be able to change answers after completing.`
        : "You've answered all questions. You won't be able to change answers after completing.",
      confirmText: "Complete Module",
      cancelText: "Keep Working",
      variant: hasUnanswered ? "danger" : "primary",
      onConfirm: doCompleteSection,
    });
  };

  const handleExit = () => {
    askConfirm({
      title: "Exit full test?",
      description:
        "Your progress will be saved, but the test won't be submitted. You can resume later from your dashboard.",
      confirmText: "Exit Test",
      cancelText: "Stay",
      variant: "warning",
      onConfirm: async () => {
        reset();
        window.location.href = "/pages/home";
      },
    });
  };

  if (breakState) {
    return (
      <BreakScreen
        breakState={breakState}
        breakRemaining={breakRemaining}
        isSubmitting={isSubmitting}
        onSkip={handleStartNextSection}
      />
    );
  }

  if (loading) return <TestLoadingState label="Loading test..." />;

  if (error || !currentModule || !currentQuestion) {
    return <TestErrorState message={error || "Session not found"} />;
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <FullTestHeader
        title={currentModule.title}
        totalQuestions={totalQuestions}
        remainingTime={remainingTime}
        currentQuestionIndex={currentQuestionIndex}
        currentModule={{
          moduleNumber: currentModule.moduleNumber,
          variant: currentModule.variant,
          subject: currentModule.subject,
        }}
        currentQuestions={currentQuestions}
        answeredSet={answeredSet}
        flaggedSet={flaggedSet}
        goToQuestion={goToQuestion}
        onHome={handleExit}
        onAnnotate={() => setShowAnnotator((v) => !v)}
        onCalculator={() => setShowCalculator((v) => !v)}
        onReference={() => setShowReference((v) => !v)}
        exitTitle="Exit full test?"
        exitDescription="Your progress will be saved, but the test won't be submitted. You can resume later from your dashboard."
      />

      <FullTestMain
        questionId={currentQuestion.id}
        passageContent={currentQuestion.passage ?? null}
        showAnnotator={showAnnotator}
        onToggleAnnotator={() => setShowAnnotator((v) => !v)}
        currentQuestion={currentQuestionIndex}
        totalQuestions={totalQuestions}
        prompt={currentQuestion.prompt}
        type={currentQuestion.type === "GRID_IN" ? "GRID_IN" : "MCQ"}
        options={currentQuestion.options}
        selectedOption={answers[currentQuestion.id]?.optionId ?? undefined}
        textAnswer={answers[currentQuestion.id]?.textAnswer ?? undefined}
        flagged={flaggedQuestions[currentQuestion.id] ?? false}
        onOptionSelect={handleOptionSelect}
        onTextChange={handleTextChange}
        onTextBlur={handleTextBlur}
        onToggleFlag={handleToggleFlag}
        disabled={isSubmitting}
      />

      <FullTestFooter
        onPrev={prevQuestion}
        onNext={nextQuestion}
        onSubmitSection={() => handleCompleteCurrentSection(false)}
        isPrevDisabled={isFirstQuestion}
        isNextDisabled={isLastQuestion}
        isModuleCompleted={isModuleCompleted}
        isFlagged={flaggedQuestions[currentQuestion.id] ?? false}
        onToggleFlag={handleToggleFlag}
        isSubmitting={isSubmitting}
        unansweredCount={unansweredCount}
      />

      <div
        onBlur={handleTextBlur}
        style={{ position: "fixed", width: 0, height: 0, opacity: 0 }}
        tabIndex={-1}
      />

      <TestToolModals
        showCalculator={showCalculator}
        onCalculatorClose={() => setShowCalculator(false)}
        showReference={showReference}
        onReferenceChange={setShowReference}
      />

      <ConfirmModal
        config={confirmConfig}
        onClose={() => setConfirmConfig(null)}
      />
    </div>
  );
}

function BreakScreen({
  breakState,
  breakRemaining,
  isSubmitting,
  onSkip,
}: {
  breakState: BreakState;
  breakRemaining: number;
  isSubmitting: boolean;
  onSkip: () => void;
}) {
  const frozenRef = React.useRef(breakRemaining);

  React.useEffect(() => {
    if (!isSubmitting) {
      frozenRef.current = breakRemaining;
    }
  }, [breakRemaining, isSubmitting]);

  const displayRemaining = isSubmitting ? frozenRef.current : breakRemaining;

  const isAutoStarting = breakRemaining <= 0 && !isSubmitting;
  const busy = isSubmitting || isAutoStarting;

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const progress =
    breakState.durationSeconds > 0
      ? Math.min(
        100,
        Math.max(
          0,
          ((breakState.durationSeconds - displayRemaining) /
            breakState.durationSeconds) *
          100,
        ),
      )
      : 0;

  return (
    <main className="flex min-h-screen items-center justify-center bg-default-50 px-5 py-10 dark:bg-default-900">
      <div className="w-full max-w-sm text-center">
        <div className="mb-6 text-5xl">{busy ? "⏳" : "☕"}</div>

        <h1 className="mb-2 text-2xl font-bold text-foreground">
          {busy ? "Starting next section…" : "Break time"}
        </h1>

        <p className="mb-8 text-sm text-default-500">
          {busy
            ? "Please wait a moment."
            : "Relax before starting the next section."}
        </p>

        <div className="mb-2 font-mono text-7xl font-bold tabular-nums text-foreground">
          {formatCountdown(displayRemaining)}
        </div>

        <div className="mb-8 h-1.5 overflow-hidden rounded-full bg-default-200 dark:bg-default-700">
          <div
            className={`h-full rounded-full bg-primary ${busy ? "" : "transition-all duration-1000 ease-linear"
              }`}
            style={{ width: `${busy ? 100 : progress}%` }}
          />
        </div>

        {!busy && (
          <p className="mb-6 text-sm text-default-500">
            Next: <span className="font-semibold text-foreground">{breakState.nextSectionTitle}</span>
          </p>
        )}

        {/* Skip button */}
        <Button
          onPress={onSkip}
          isDisabled={busy}
          className="h-12 w-full rounded-xl bg-primary text-base font-semibold text-white disabled:opacity-60"
          size="lg"
        >
          {busy ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Starting…
            </span>
          ) : (
            "Skip break"
          )}
        </Button>

        {!busy && (
          <p className="mt-4 text-xs text-default-400">
            Starts automatically when timer ends
          </p>
        )}
      </div>
    </main>
  );
}