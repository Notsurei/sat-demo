"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { Button, Modal, Spinner, toast } from "@heroui/react";

import FullTestHeader from "../../../components/FullTestHeader";
import FullTestMain from "../../../components/FullTestBody";
import FullTestFooter from "../../../components/FullTestFooter";

import { useFullTestStore } from "@/zustand/full-test-store";
import { useFullTestTimerStore } from "@/zustand/full-test-timer";
import FloatingCalculator from "@/app/components/floating-calculator/floating-calculator";
import ReferenceSheetModal from "@/app/components/modal-button/reference-sheet-modal";

interface ApiOption {
  id: string;
  label: string;
  content: string;
}

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

interface ConfirmConfig {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "primary" | "danger" | "warning";
  onConfirm: () => void | Promise<void>;
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
      variant: null,
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

export default function TestTakingPage() {
  const params = useParams<{ testId: string; sessionId: string }>();
  const { sessionId } = params ?? {};

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAnnotator, setShowAnnotator] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showReference, setShowReference] = useState(false);

  const [confirmConfig, setConfirmConfig] = useState<ConfirmConfig | null>(null);

  const hasAutoSubmittedRef = useRef(false);

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
    flagQuestion,
    reset,
  } = useFullTestStore();

  const { remainingTime, isRunning, tick } = useFullTestTimerStore();

  const askConfirm = (config: ConfirmConfig) => {
    setConfirmConfig(config);
  };

  const handleConfirmAction = async () => {
    if (!confirmConfig) return;
    const { onConfirm } = confirmConfig;
    setConfirmConfig(null);
    await onConfirm();
  };

  const fetchSessionPayload = async (): Promise<ApiSessionPayload | null> => {
    if (!sessionId) return null;
    try {
      const res = await axios.get(
        `/api/full-test/sessions/${sessionId}/result`,
        { withCredentials: true },
      );
      if (!res.data?.success) return null;
      return res.data.data as ApiSessionPayload;
    } catch {
      return null;
    }
  };

  const applyPayload = (payload: ApiSessionPayload) => {
    const sectionsForStore = buildSectionsForStore(payload);

    loadFromSession({
      examId: payload.session.examId,
      title: payload.exam.title,
      sections: sectionsForStore,
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

        const firstSection = sortSections(payload.sections)[0];
        if (firstSection) {
          const totalSec = firstSection.durationSeconds;
          const elapsed = Math.floor(
            (Date.now() - new Date(payload.session.startedAt).getTime()) / 1000,
          );
          const remaining = Math.max(0, totalSec - elapsed);

          useFullTestTimerStore.setState({
            phase: firstSection.subject === "SAT_MATH" ? "MATH_M1" : "RW_M1",
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
  }, [sessionId]);


  useEffect(() => {
    if (!isRunning) return;
    const id = window.setInterval(() => tick(), 1000);
    return () => window.clearInterval(id);
  }, [isRunning, tick]);

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


  useEffect(() => {
    if (
      remainingTime === 0 &&
      !loading &&
      modules.length > 0 &&
      !hasAutoSubmittedRef.current
    ) {
      hasAutoSubmittedRef.current = true;
      toast.warning("Time's up!", { description: "Submitting module..." });
      void handleSubmitCurrentSection(true);
    }
  }, [remainingTime, loading, modules.length]);

  const saveAnswerToServer = async (
    questionId: string,
    payload: {
      optionId?: string | null;
      textAnswer?: string | null;
      isFlagged?: boolean;
    },
  ) => {
    if (!sessionId) return;
    try {
      await axios.post(
        `/api/full-test/sessions/${sessionId}/answers/${questionId}`,
        {
          selectedOptionId: payload.optionId ?? null,
          textAnswer: payload.textAnswer ?? null,
          isFlagged: payload.isFlagged,
        },
        { withCredentials: true },
      );
    } catch (err) {
      console.warn("Save answer failed (ignored):", err);
    }
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


  const doSubmitSection = async () => {
    if (!currentModule || !sessionId) return;

    try {
      setIsSubmitting(true);

      const res = await axios.post(
        `/api/full-test/sessions/sections/${currentModule.id}/complete`,
        {},
        { withCredentials: true },
      );

      const nextExamSectionId: string | undefined =
        res.data?.data?.nextSection?.id;

      if (!nextExamSectionId) {
        await handleSubmitTest();
        return;
      }

      const payload = await fetchSessionPayload();
      if (!payload) throw new Error("Failed to refresh session");

      applyPayload(payload);

      const sortedSections = sortSections(payload.sections);
      const nextIdx = sortedSections.findIndex(
        (s) => s.sectionId === nextExamSectionId,
      );

      if (nextIdx < 0) throw new Error("Next section index not found");

      const nextSection = sortedSections[nextIdx];

      setCurrentModule(nextIdx);
      hasAutoSubmittedRef.current = false;

      const totalSec = nextSection.durationSeconds;
      useFullTestTimerStore.setState({
        phase: nextSection.subject === "SAT_MATH" ? "MATH_M1" : "RW_M2",
        remainingTime: totalSec,
        initialTime: totalSec,
        isRunning: true,
        isPaused: false,
      });

      toast.success(`Starting ${nextSection.title}`, {
        description: nextSection.variant
          ? `Adaptive path: ${nextSection.variant}`
          : undefined,
      });
    } catch (err: any) {
      console.error("Section complete failed:", err);
      toast.danger("Failed to submit section", {
        description:
          err.response?.data?.message || err.message || "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitCurrentSection = async (auto = false) => {
    if (!currentModule || !sessionId) return;

    if (auto) {
      await doSubmitSection();
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
      onConfirm: doSubmitSection,
    });
  };

  const handleSubmitTest = async () => {
    if (!sessionId) return;
    try {
      setIsSubmitting(true);
      await axios.post(
        `/api/full-test/sessions/${sessionId}/submit`,
        {},
        { withCredentials: true },
      );
      toast.success("Full test submitted!");
      window.location.href = `/pages/full-test-report/${sessionId}`;
    } catch (err: any) {
      toast.danger("Submit failed", {
        description: err.response?.data?.message || "Please try again.",
      });
      setIsSubmitting(false);
    }
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


  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-default-50">
        <Spinner size="lg" />
        <span className="ml-4 text-default-500">Loading test...</span>
      </div>
    );
  }

  if (error || !currentModule || !currentQuestion) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-default-50 p-6">
        <div className="text-center">
          <p className="mb-4 text-lg font-semibold text-danger">
            ❌ {error || "Session not found"}
          </p>
          <button
            onClick={() => (window.location.href = "/pages/home")}
            className="rounded-lg bg-primary px-4 py-2 text-white"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <FullTestHeader
        title={currentModule.title}
        totalQuestions={totalQuestions}
        onHome={handleExit}
        onAnnotate={() => setShowAnnotator((v) => !v)}
        onCalculator={() => setShowCalculator((v) => !v)}
        onReference={() => setShowReference((v) => !v)}
      />

      <FullTestMain
        passageContent={currentQuestion.passage ?? null}
        showAnnotator={showAnnotator}
        onToggleAnnotator={() => setShowAnnotator((v) => !v)}
        currentQuestion={currentQuestionIndex}
        totalQuestions={totalQuestions}
        prompt={currentQuestion.prompt}
        type={currentQuestion.type === "GRID_IN" ? "GRID_IN" : "MCQ"}
        options={currentQuestion.options}
        selectedOption={answers[currentQuestion.id]?.optionId}
        textAnswer={answers[currentQuestion.id]?.textAnswer}
        flagged={flaggedQuestions[currentQuestion.id] ?? false}
        onOptionSelect={handleOptionSelect}
        onTextChange={handleTextChange}
        onToggleFlag={handleToggleFlag}
        disabled={isSubmitting}
      />

      <FullTestFooter
        onPrev={prevQuestion}
        onNext={nextQuestion}
        onSubmitSection={() => handleSubmitCurrentSection(false)}
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

      {showCalculator && (
        <FloatingCalculator onClose={() => setShowCalculator(false)} />
      )}

      <ReferenceSheetModal
        isOpen={showReference}
        onOpenChange={setShowReference}
      />

      <Modal
        isOpen={confirmConfig !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmConfig(null);
        }}
      >
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="w-[calc(100vw-2rem)] sm:max-w-md">
              <Modal.Header className="border-b border-default-200">
                <Modal.Heading className="text-lg font-semibold">
                  {confirmConfig?.title}
                </Modal.Heading>
              </Modal.Header>

              <Modal.Body className="py-4">
                <p className="text-sm leading-6 text-default-600">
                  {confirmConfig?.description}
                </p>
              </Modal.Body>

              <Modal.Footer className="border-t border-default-200">
                <div className="flex w-full justify-end gap-2">
                  <Button
                    variant="outline"
                    onPress={() => setConfirmConfig(null)}
                  >
                    {confirmConfig?.cancelText ?? "Cancel"}
                  </Button>

                  <Button
                    variant="primary"
                    onPress={handleConfirmAction}
                  >
                    {confirmConfig?.confirmText ?? "Confirm"}
                  </Button>
                </div>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}