"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { toast } from "@heroui/react";

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
import { useRouter } from "@/i18n/navigation";
import type { ApiOption, ConfirmConfig } from "@/types/test-page";

const API_BASE = "/api/math-module-test";

/* ─────────────────────────────────────────────────────────────
   API types — NEW shape (sections[])
   ───────────────────────────────────────────────────────────── */
interface ApiQuestion {
  questionId: string;
  order: number;
  question: {
    id: string;
    prompt: string;
    passage: string | null;
    domain: string | null;
    subtopic: string | null;
    difficulty: string | null;
    type: string;
    options: ApiOption[];
  };
  answer: {
    selectedOptionId: string | null;
    textAnswer: string | null;
    isFlagged: boolean;
    timeSpent: number;
    answeredAt: string | null;
  } | null;
}

interface ApiSection {
  id: string;                    // sectionSessionId
  examSectionId: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "EXPIRED";
  startedAt: string | null;
  completedAt: string | null;
  timeSpent: number;
  remainingTime: number | null;
  lastActivityAt: string;
  section: {
    id: string;                  // examSectionId
    subject: string;
    title: string;
    order: number;
    duration: number;
    durationSeconds: number;
    moduleNumber: number;
    variant: string | null;
  };
  questions: ApiQuestion[];
}

interface ApiSessionPayload {
  sessionId: string;
  examId: string;
  status: string;
  currentSectionOrder: number;
  startedAt: string;
  completedAt: string | null;
  lastActivityAt: string;
  totals: {
    correct: number | null;
    wrong: number | null;
    skipped: number | null;
    rawScore: number | null;
    scaledScore: number | null;
  };
  exam: {
    id: string;
    title: string;
    duration: number;
    totalQuestions: number;
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
      weightedPct: number;
      scaledScore: number;
      timeSpent: number;
    };
    adaptive: {
      variant: "EASY" | "HARD";
      weightedPct: number;
      filledCount: number;
    } | null;
    nextSection: {
      id: string;
      sectionSessionId: string;
      examSectionId: string;
      moduleNumber: number;
      title: string;
      order: number;
      duration: number;
      durationSeconds: number;
      variant: string | null;
      questionCount: number;
    } | null;
    nextSectionId: string | null;
    isLastModule: boolean;
  };
}

const buildModulesFromPayload = (payload: ApiSessionPayload) =>
  payload.sections.map((s) => ({
    id: s.id,                                      
    section: {
      order: s.section.order,
      subject: s.section.subject,
      title: s.section.title,
      duration: s.section.duration,
      breakAfter: null,
      variant: s.section.variant,
    },
    questions: s.questions.map((q) => ({
      question: {
        id: q.question.id,
        prompt: q.question.prompt,
        type: q.question.type,
        passage: q.question.passage,
        explanation: null,
        options: q.question.options,
        difficulty: q.question.difficulty,
        domain: q.question.domain,
        subtopic: q.question.subtopic,
      },
    })),
  }));

export default function MathModuleTestPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params?.sessionId;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAnnotator, setShowAnnotator] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showReference, setShowReference] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<ConfirmConfig | null>(
    null,
  );

  const hasAutoSubmittedRef = useRef(false);
  const questionStartRef = useRef<number>(Date.now());
  const prevQuestionIdRef = useRef<string | null>(null);
  const questionTimeMapRef = useRef<Map<string, number>>(new Map());
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
    goToQuestion,
    setOptionAnswer,
    setTextAnswer,
    toggleFlagQuestion,
    flagQuestion,
    reset,
  } = useFullTestStore();

  const { remainingTime, isRunning, tick } = useFullTestTimerStore();

  const { answeredSet, flaggedSet } = useTestHeaderAdapter({
    answers,
    flaggedQuestions,
  });

  const currentModule = modules[currentModuleIndex];
  const currentQuestions = currentModule?.questions ?? [];
  const currentQuestion = currentQuestions[currentQuestionIndex];

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

  const askConfirm = (config: ConfirmConfig) => setConfirmConfig(config);

  /* ── Apply payload — load tất cả 2 sections ── */
  const applyPayload = (payload: ApiSessionPayload) => {
    loadFromSession({
      examId: payload.examId,
      title: payload.exam.title,
      sections: buildModulesFromPayload(payload),
    });

    const store = useFullTestStore.getState();
    payload.sections.forEach((s) => {
      s.questions.forEach((q) => {
        if (q.answer?.selectedOptionId) {
          store.setOptionAnswer(q.question.id, q.answer.selectedOptionId);
        } else if (q.answer?.textAnswer) {
          store.setTextAnswer(q.question.id, q.answer.textAnswer);
        }
        if (q.answer?.isFlagged) {
          store.flagQuestion(q.question.id);
        }
      });
    });

    /* ── FIX: set current module index + timer theo section đang active ── */
    const activeIdx = payload.sections.findIndex(
      (s) => s.status === "IN_PROGRESS",
    );
    const idx = activeIdx >= 0
      ? activeIdx
      : payload.sections.findIndex(
        (s) => s.section.order === payload.currentSectionOrder,
      );

    if (idx >= 0) {
      const active = payload.sections[idx];
      setCurrentModule(idx);
      goToQuestion(0);

      const totalSec = active.remainingTime ?? active.section.durationSeconds;
      useFullTestTimerStore.setState({
        phase: active.section.moduleNumber === 1 ? "MATH_M1" : "MATH_M2",
        remainingTime: totalSec,
        initialTime: active.section.durationSeconds,
        isRunning: active.status === "IN_PROGRESS",
        isPaused: false,
      });
    }
  };

  /* ── Fetch session ── */
  const fetchSessionPayload = async (): Promise<ApiSessionPayload | null> => {
    if (!sessionId) return null;
    try {
      const res = await axios.get(`${API_BASE}/sessions/${sessionId}`, {
        withCredentials: true,
      });
      if (!res.data?.success) return null;
      return res.data.data as ApiSessionPayload;
    } catch {
      return null;
    }
  };

  /* ── Init ── */
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

        if (payload.status === "COMPLETED") {
          router.replace(`/pages/math-module-report/${sessionId}`);
          return;
        }

        applyPayload(payload);
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

  /* ── Timer tick ── */
  useEffect(() => {
    if (!isRunning) return;
    const id = window.setInterval(() => tick(), 1000);
    return () => window.clearInterval(id);
  }, [isRunning, tick]);

  /* ── Derived state ── */
  const totalQuestions = currentQuestions.length;
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

  const unansweredCount = currentQuestions.filter((q) => {
    const a = answers[q.id];
    return !a?.optionId && !a?.textAnswer?.trim();
  }).length;

  const isModuleCompleted = isLastQuestion && unansweredCount === 0;

  /* ── Auto submit khi hết giờ ── */
  useEffect(() => {
    if (
      remainingTime === 0 &&
      !loading &&
      modules.length > 0 &&
      !hasAutoSubmittedRef.current
    ) {
      hasAutoSubmittedRef.current = true;
      toast.warning("Time's up!", { description: "Submitting module..." });
      void handleCompleteCurrentSection(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingTime, loading, modules.length]);

  /* ── Save answer ── */
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
    if (currentQuestion.type !== "GRID_IN") return;
    const a = answers[currentQuestion.id];
    const text = a?.textAnswer?.trim();
    if (!text) return;
    void saveAnswerToServer(currentQuestion.id, { textAnswer: text });
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

  const doCompleteSection = async () => {
    if (!currentModule || !sessionId) return;

    await flushCurrentTextAnswer();
    if (pendingAnswersRef.current.size > 0) {
      await Promise.allSettled(Array.from(pendingAnswersRef.current));
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

      const { nextSection, adaptive, result, isLastModule } = res.data.data;

      if (isLastModule || !nextSection) {
        reset();
        pendingAnswersRef.current.clear();
        questionTimeMapRef.current.clear();
        prevQuestionIdRef.current = null;

        toast.success("Math module completed!", {
          description: `Scaled score: ${result.scaledScore ?? "—"}`,
        });

        router.replace(`/pages/math-module-report/${sessionId}`);
        return;
      }

      const payload = await fetchSessionPayload();
      if (!payload) throw new Error("Failed to refresh session");

      applyPayload(payload);

      questionTimeMapRef.current.clear();
      prevQuestionIdRef.current = null;
      questionStartRef.current = Date.now();
      hasAutoSubmittedRef.current = false;

      toast.success("Module 1 done!", {
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
      title: `Submit "${currentModule.title}"?`,
      description: hasUnanswered
        ? `You still have ${unansweredCount} unanswered question${unansweredCount > 1 ? "s" : ""
        }. You won't be able to change answers after submitting.`
        : "You've answered all questions. You won't be able to change answers after submitting.",
      confirmText: "Submit Module",
      cancelText: "Keep Working",
      variant: hasUnanswered ? "danger" : "primary",
      onConfirm: doCompleteSection,
    });
  };

  const handleExit = () => {
    askConfirm({
      title: "Exit math module?",
      description:
        "Your progress will be saved. You can resume later from your dashboard.",
      confirmText: "Exit",
      cancelText: "Stay",
      variant: "warning",
      onConfirm: async () => {
        reset();
        pendingAnswersRef.current.clear();
        questionTimeMapRef.current.clear();
        prevQuestionIdRef.current = null;
        router.push("/pages/home");
      },
    });
  };

  if (loading) return <TestLoadingState label="Loading math module..." />;

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
        exitTitle="Exit math module?"
        exitDescription="Your progress will be saved. You can resume later from your dashboard."
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
        onPrev={handlePrev}
        onNext={handleNext}
        onSubmitSection={() => handleCompleteCurrentSection(false)}
        isPrevDisabled={isFirstQuestion}
        isNextDisabled={isLastQuestion}
        isModuleCompleted={isModuleCompleted}
        isFlagged={flaggedQuestions[currentQuestion.id] ?? false}
        onToggleFlag={handleToggleFlag}
        isSubmitting={isSubmitting}
        unansweredCount={unansweredCount}
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