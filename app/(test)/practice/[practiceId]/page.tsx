"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { usePracticeStore } from "@/zustand/practice-store";
import { usePracticeTimerStore } from "@/zustand/practice-timer";
import { usePracticeConfigStore } from "@/zustand/practice-config";
import PracticeHeader from "@/app/(test)/practice/components/PracticeHeader";
import PracticeMain from "@/app/(test)/practice/components/PracticeBody";
import PracticeFooter from "@/app/(test)/practice/components/PracticeFooter";
import Calculator from "@/app/components/floating-calculator/floating-calculator";
import ReferenceSheetModal from "@/app/components/modal-button/reference-sheet-modal";
import KnowledgeModal from "@/app/components/modal-button/knowledge-modal";
import { Button, toast } from "@heroui/react";

export default function PracticeScreen() {
  const router = useRouter();

  const searchParams = useSearchParams();

  const params = useParams<{
    practiceId: string;
  }>();

  const practiceIdFromUrl = params.practiceId ?? searchParams.get("id") ?? null;

  const {
    practiceId,
    questions,
    currentQuestion,
    answers,
    loading,
    error,
    fetchPractice,
    submitPractice,
    nextQuestion,
    prevQuestion,
    setOptionAnswer,
    setTextAnswer,
    reset: resetPractice,
  } = usePracticeStore();

  const {
    seconds,
    start: startTimer,
    pause: pauseTimer,
    reset: resetTimer,
  } = usePracticeTimerStore();

  const { subject, category, subtopic } = usePracticeConfigStore();
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [textAnswer, setTextAnswerLocal] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [timeOutReached, setTimeOutReached] = useState(false);
  const [showAnnotator, setShowAnnotator] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showReference, setShowReference] = useState(false);
  const [showKnowledge, setShowKnowledge] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [timeSpent, setTimeSpent] = useState<number>(0);
  const questionStartTimeRef = useRef<number>(Date.now());
  const questionTimesRef = useRef<Record<string, number>>({});

  const currentQ = questions[currentQuestion] || null;

  const total = questions.length;

  const saveCurrentQuestionTime = () => {
    if (!currentQ) return;

    const now = Date.now();

    const elapsedSeconds = Math.max(
      0,
      Math.floor((now - questionStartTimeRef.current) / 1000),
    );

    const previousTime = questionTimesRef.current[currentQ.id] ?? 0;

    const totalTime = previousTime + elapsedSeconds;

    questionTimesRef.current[currentQ.id] = totalTime;

    setTimeSpent(totalTime);
    questionStartTimeRef.current = now;
  };

  const toggleAnnotator = () => {
    setShowAnnotator((prev) => !prev);
  };

  useEffect(() => {
    if (!currentQ) return;

    questionStartTimeRef.current = Date.now();

    setTimeSpent(questionTimesRef.current[currentQ.id] ?? 0);
  }, [currentQuestion]);

  useEffect(() => {
    if (!practiceIdFromUrl) return;

    if (practiceIdFromUrl === practiceId) return;

    fetchPractice(practiceIdFromUrl);
  }, [practiceIdFromUrl, practiceId, fetchPractice]);

  useEffect(() => {
    if (!loading && questions.length > 0 && seconds === 0) {
      startTimer();
    }
  }, [loading, questions.length, seconds, startTimer]);

  useEffect(() => {
    return () => {
      pauseTimer();
    };
  }, [pauseTimer]);

  useEffect(() => {
    if (!currentQ) return;

    const ans = answers[currentQ.id];

    setShowFeedback(false);

    setIsCorrect(false);

    setShowHint(false);

    setSelectedOption(ans?.optionId ?? "");

    setTextAnswerLocal(ans?.textAnswer ?? "");
  }, [currentQuestion, currentQ?.id, answers]);

  useEffect(() => {
    if (loading || !currentQ) {
      const timer = setTimeout(() => {
        setTimeOutReached(true);
      }, 5000);

      return () => clearTimeout(timer);
    }

    setTimeOutReached(false);
  }, [loading, currentQ?.id]);

  const handleOptionSelect = (optionId: string) => {
    if (!currentQ || showFeedback) return;

    setSelectedOption(optionId);

    setOptionAnswer(currentQ.id, optionId);

    setShowFeedback(false);
  };

  const handleTextChange = (value: string) => {
    if (!currentQ || showFeedback) return;

    setTextAnswerLocal(value);

    setTextAnswer(currentQ.id, value);

    setShowFeedback(false);
  };

  const handleCheck = () => {
    if (!currentQ) return;
    saveCurrentQuestionTime();

    let correct = false;

    if (currentQ.type === "MCQ") {
      if (currentQ.correctOptionId) {
        correct = selectedOption === currentQ.correctOptionId;
      } else if (currentQ.correctAnswer && currentQ.options) {
        const correctOpt = currentQ.options.find(
          (option) => option.label === currentQ.correctAnswer,
        );

        if (correctOpt) {
          correct = selectedOption === correctOpt.id;
        } else {
          correct = selectedOption === currentQ.correctAnswer;
        }
      }
    } else {
      const userAns = textAnswer.trim().toLowerCase();

      const correctAns =
        currentQ.correctTextAnswer?.trim().toLowerCase() ||
        currentQ.correctAnswer?.trim().toLowerCase() ||
        "";

      correct = userAns === correctAns;
    }

    setIsCorrect(correct);

    setShowFeedback(true);
  };

  const handleHint = () => {
    setShowHint((prev) => !prev);
  };

  const handlePrev = () => {
    if (currentQuestion <= 0) return;

    saveCurrentQuestionTime();

    prevQuestion();
  };

  const handleNext = () => {
    if (currentQuestion < total - 1) {
      saveCurrentQuestionTime();

      nextQuestion();

      return;
    }

    handleSubmit();
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      pauseTimer();
      saveCurrentQuestionTime();

      const result = await submitPractice(questionTimesRef.current);

      if (!result?.success) {
        throw new Error(result?.error || "Submit failed");
      }

      const submittedPracticeId = result.practice?.id;

      if (!submittedPracticeId) {
        throw new Error("Practice ID not found after submit");
      }

      resetTimer();

      router.replace(`/pages/practice-report/${submittedPracticeId}`);
    } catch (error) {
      console.error("Submit practice error:", error);

      setIsSubmitting(false);

      resetTimer();

      toast.danger("Something went wrong", {
        actionProps: {
          variant: "danger",
        },

        description:
          "Something went wrong while saving your answers. Please try again later.",
      });
    }
  };

  const handleHome = () => {
    pauseTimer();

    resetTimer();

    resetPractice();

    router.push("/pages/home");
  };

  if (isSubmitting) {
    return (
      <div className="flex h-screen items-center justify-center bg-default-50 dark:bg-default-900">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />

          <div className="text-center">
            <p className="font-semibold text-foreground">
              Submitting your practice...
            </p>

            <p className="mt-1 text-sm text-default-400">
              Saving your answers and preparing your report.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-default-50 dark:bg-default-900">
        <div className="text-lg font-semibold text-danger">❌ {error}</div>

        <button
          onClick={() => router.push("/pages/dashboard")}
          className="rounded-lg border border-default-200 px-4 py-2 hover:bg-default-100"
        >
          ← Go Home
        </button>
      </div>
    );
  }

  if (loading || !currentQ) {
    return (
      <div className="flex h-screen items-center justify-center bg-default-50 dark:bg-default-900">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />

          <span className="text-default-500">Loading practice...</span>

          {timeOutReached && (
            <div className="flex flex-col items-center justify-center gap-3">
              <span className="text-lg font-semibold text-danger">
                No test found!
              </span>

              <Button onClick={() => router.push("/pages/dashboard")}>
                Go home
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const type = currentQ.type || "multiple-choice";

  let correctDisplay: string | undefined;

  if (currentQ.type === "MCQ") {
    if (currentQ.correctOptionId) {
      const found = currentQ.options?.find(
        (option) => option.id === currentQ.correctOptionId,
      );

      correctDisplay = found?.label;
    }

    if (!correctDisplay) {
      correctDisplay = currentQ.correctAnswer;
    }
  } else {
    correctDisplay = currentQ.correctTextAnswer || currentQ.correctAnswer;
  }

  const feedbackMessage = isCorrect
    ? "Great job! 🎉"
    : `Correct answer: ${correctDisplay || "N/A"}`;

  const canCheck =
    currentQ.type === "MCQ" ? !!selectedOption : !!textAnswer.trim();

  const subjectNameMap: Record<string, string> = {
    SAT_MATH: "Math",

    SAT_RW: "Reading & Writing",

    SAT_PRECALCULUS: "Precalculus",

    full: "Full Test",
  };

  const displaySubject = subject
    ? subjectNameMap[subject] || subject
    : "SAT Practice";

  return (
    <div className="flex h-screen flex-col bg-default-50 dark:bg-default-900">
      <PracticeHeader
        title="Practice Session"
        questionIndex={currentQuestion}
        totalQuestions={questions.length}
        subject={subject}
        category={category}
        subtopic={subtopic}
        onHome={() => router.push('/')}
        onAnnotate={() => { setShowAnnotator(true) }}
        onCalculator={() => { setShowCalculator(true) }}
        onReference={() => { setShowReference(true) }}
        onKnowledgeReview={() => { setShowKnowledge(true) }}
      />

      <PracticeMain
        passageContent={currentQ.passage || null}
        showAnnotator={showAnnotator}
        onToggleAnnotator={toggleAnnotator}
        currentQuestion={currentQuestion}
        totalQuestions={total}
        prompt={currentQ.prompt}
        explanation={currentQ.explanation || null}
        type={type}
        options={currentQ.options}
        selectedOption={selectedOption}
        textAnswer={textAnswer}
        onOptionSelect={handleOptionSelect}
        onTextChange={handleTextChange}
        showHint={showHint}
        hintContent={currentQ.hint}
        showFeedback={showFeedback}
        isCorrect={isCorrect}
        feedbackMessage={feedbackMessage}
        disabled={showFeedback}
        domain={currentQ.domain}
        subtopic={currentQ.subtopic}
        correctAnswer={correctDisplay}
        timeSpent={timeSpent}
      />

      <PracticeFooter
        onCheck={handleCheck}
        onHint={handleHint}
        hasHint={!!currentQ.hint}
        showHint={showHint}
        onPrev={handlePrev}
        isPrevDisabled={currentQuestion === 0}
        onNext={handleNext}
        showNext={showFeedback}
        nextLabel={
          currentQuestion === total - 1 ? "📤 Submit" : "Next Question →"
        }
        isNextDisabled={!showFeedback}
        canCheck={canCheck}
      />

      {showCalculator && (
        <Calculator onClose={() => setShowCalculator(false)} />
      )}

      <ReferenceSheetModal
        isOpen={showReference}
        onOpenChange={setShowReference}
      />

      <KnowledgeModal isOpen={showKnowledge} onOpenChange={setShowKnowledge} />
    </div>
  );
}
