"use client";

import React, { useState } from "react";

import { Button, Modal } from "@heroui/react";

import {
  Calculator,
  ClockFill,
  Flag,
  House,
  Pencil,
  SquareListUl,
} from "@gravity-ui/icons";

import { useFullTestStore } from "@/zustand/full-test-store";
import { useFullTestTimerStore } from "@/zustand/full-test-timer";

import QuestionMapModal from "@/app/components/modal-button/questionmap";

interface FullTestHeaderProps {
  title: string;
  /**
   * @deprecated Không dùng nữa — header tự build sectionLabel từ store.
   */
  sectionName?: string;
  totalQuestions: number;
  onHome: () => void;
  onAnnotate: () => void;
  onCalculator: () => void;
  onReference: () => void;
}

interface VariantBadge {
  label: string;
  emoji: string;
  className: string;
}

const MIXED_BADGE: VariantBadge = {
  label: "Mixed",
  emoji: "🎯",
  className:
    "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

const HARD_BADGE: VariantBadge = {
  label: "Hard",
  emoji: "🔥",
  className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const MEDIUM_BADGE: VariantBadge = {
  label: "Medium",
  emoji: "⚡",
  className:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
};

const EASY_BADGE: VariantBadge = {
  label: "Easy",
  emoji: "🌱",
  className:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
};

export default function FullTestHeader({
  title,
  totalQuestions,
  onHome,
  onAnnotate,
  onCalculator,
  onReference,
}: FullTestHeaderProps) {
  const [isMapOpen, setIsMapOpen] = useState(false);

  const { remainingTime } = useFullTestTimerStore();

  const {
    currentQuestionIndex,
    currentModuleIndex,
    modules,
    answers,
    flaggedQuestions,
    goToQuestion,
  } = useFullTestStore();

  const currentModule = modules[currentModuleIndex];
  const currentQuestions = currentModule?.questions ?? [];

  const answeredSet = new Set(
    Object.entries(answers)
      .filter(([, answer]) => {
        return Boolean(answer?.optionId || answer?.textAnswer?.trim());
      })
      .map(([questionId]) => questionId),
  );

  const flaggedSet = new Set(
    Object.entries(flaggedQuestions)
      .filter(([, flagged]) => flagged)
      .map(([questionId]) => questionId),
  );

  const tools = [
    {
      icon: <Pencil className="h-5 w-5" />,
      label: "Annotate",
      onPress: onAnnotate,
      color: "text-blue-500",
      bgColor:
        "bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40",
    },
    {
      icon: <Calculator className="h-5 w-5" />,
      label: "Calculator",
      onPress: onCalculator,
      color: "text-purple-500",
      bgColor:
        "bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/40",
    },
    {
      icon: <SquareListUl className="h-5 w-5" />,
      label: "Reference",
      onPress: onReference,
      color: "text-orange-500",
      bgColor:
        "bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/40",
    },
    {
      icon: <Flag className="h-5 w-5" />,
      label: "Map",
      onPress: () => setIsMapOpen(true),
      color: "text-pink-500",
      bgColor:
        "bg-pink-50 hover:bg-pink-100 dark:bg-pink-900/20 dark:hover:bg-pink-900/40",
    },
  ];

  const formatTime = (seconds: number) => {
    const safeSeconds = Math.max(0, seconds);
    const minutes = Math.floor(safeSeconds / 60);
    const remainingSeconds = safeSeconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const moduleNumber = currentModule?.moduleNumber ?? null;
  const variant = currentModule?.variant ?? null;

  const subjectLabel =
    currentModule?.subject === "SAT_MATH"
      ? "Math"
      : currentModule?.subject
        ? "Reading & Writing"
        : null;

  let difficultyBadge: VariantBadge | null = null;

  if (moduleNumber === 1) {
    difficultyBadge = MIXED_BADGE;
  } else if (moduleNumber === 2) {
    if (variant === "HARD") difficultyBadge = HARD_BADGE;
    else if (variant === "MEDIUM") difficultyBadge = MEDIUM_BADGE;
    else if (variant === "EASY") difficultyBadge = EASY_BADGE;
    else
      difficultyBadge = {
        label: "Adaptive",
        emoji: "🎯",
        className:
          "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
      };
  }

  return (
    <>
      <header
        className="
          sticky
          top-0
          z-30
          border-b
          border-gray-200
          bg-white/95
          shadow-sm
          backdrop-blur-md
          dark:border-gray-700
          dark:bg-gray-900/95
        "
      >
        <div className="mx-auto w-full px-3 sm:px-4 lg:px-6">
          <div
            className="
              flex
              min-h-16
              items-center
              justify-between
              gap-3
              py-2
              md:h-16
              md:py-0
            "
          >
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
              <Modal>
                <Button
                  variant="primary"
                  isIconOnly
                  aria-label="Exit full test"
                  className="
                    shrink-0
                    rounded-xl
                    bg-gradient-to-br
                    from-blue-500
                    to-blue-600
                    text-white
                    shadow-md
                    transition-all
                    hover:from-blue-600
                    hover:to-blue-700
                  "
                >
                  <House className="h-5 w-5" />
                </Button>

                <Modal.Backdrop>
                  <Modal.Container>
                    <Modal.Dialog className="w-[calc(100vw-2rem)] sm:max-w-[380px]">
                      <Modal.CloseTrigger />
                      <Modal.Heading>
                        Are you sure you want to exit?
                      </Modal.Heading>
                      <Modal.Body>
                        <p className="text-sm leading-6 text-default-500">
                          Exiting will end your current full test session. Your
                          progress may be lost.
                        </p>
                      </Modal.Body>
                      <Modal.Footer>
                        <div className="flex w-full gap-2">
                          <Button variant="outline" fullWidth onPress={onHome}>
                            Exit
                          </Button>
                          <Button variant="primary" fullWidth>
                            Cancel
                          </Button>
                        </div>
                      </Modal.Footer>
                    </Modal.Dialog>
                  </Modal.Container>
                </Modal.Backdrop>
              </Modal>

              <div
                className="
                  hidden
                  h-8
                  w-px
                  shrink-0
                  bg-gray-200
                  sm:block
                  dark:bg-gray-700
                "
              />

              <div className="min-w-0">
                <h1
                  className="
                    truncate
                    text-sm
                    font-black
                    text-gray-900
                    sm:text-base
                    dark:text-white
                  "
                >
                  {title}
                </h1>

                <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                  {subjectLabel && (
                    <span
                      className="
                        inline-flex
                        max-w-[220px]
                        truncate
                        rounded-full
                        bg-blue-50
                        px-2
                        py-0.5
                        text-[11px]
                        font-semibold
                        text-blue-700
                        dark:bg-blue-900/30
                        dark:text-blue-300
                      "
                    >
                      {subjectLabel}
                    </span>
                  )}

                  {moduleNumber !== null && (
                    <span
                      className="
                        inline-flex
                        items-center
                        rounded-full
                        bg-violet-100
                        px-2
                        py-0.5
                        text-[11px]
                        font-semibold
                        text-violet-700
                        dark:bg-violet-900/30
                        dark:text-violet-300
                      "
                    >
                      Module {moduleNumber}
                    </span>
                  )}

                  {difficultyBadge && (
                    <span
                      className={[
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5",
                        "text-[11px] font-bold uppercase tracking-wide",
                        difficultyBadge.className,
                      ].join(" ")}
                    >
                      <span aria-hidden>{difficultyBadge.emoji}</span>
                      <span>{difficultyBadge.label}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div
              className="
                flex
                shrink-0
                items-center
                justify-center
                gap-2
                sm:gap-3
              "
            >
              <div
                className="
                  flex
                  items-center
                  gap-1.5
                  whitespace-nowrap
                  rounded-xl
                  border
                  border-blue-200
                  bg-blue-50
                  px-3
                  py-2
                  text-sm
                  font-bold
                  text-blue-700
                  shadow-sm
                  dark:border-blue-800
                  dark:bg-blue-900/20
                  dark:text-blue-300
                "
              >
                <span>Q</span>
                <span>{currentQuestionIndex + 1}</span>
                <span className="text-blue-400 dark:text-blue-500">/</span>
                <span>{totalQuestions}</span>
              </div>

              <div
                className="
                  flex
                  items-center
                  gap-1.5
                  whitespace-nowrap
                  rounded-xl
                  border
                  border-green-200
                  bg-green-50
                  px-3
                  py-2
                  font-mono
                  text-sm
                  font-bold
                  text-green-700
                  shadow-sm
                  dark:border-green-800
                  dark:bg-green-900/20
                  dark:text-green-300
                "
              >
                <ClockFill className="h-4 w-4 shrink-0" />
                <span className="font-black">{formatTime(remainingTime)}</span>
              </div>
            </div>

            <div
              className="
                hidden
                min-w-0
                flex-1
                justify-end
                md:flex
              "
            >
              <div className="flex items-center gap-2">
                {tools.map(({ icon, label, onPress, color, bgColor }) => (
                  <Button
                    key={label}
                    variant="primary"
                    onPress={onPress}
                    className={`
                      flex
                      items-center
                      gap-2
                      rounded-xl
                      border
                      border-gray-200
                      px-3
                      py-2
                      shadow-sm
                      transition-all
                      hover:shadow-md
                      dark:border-gray-700
                      ${bgColor}
                    `}
                  >
                    <span className={color}>{icon}</span>
                    <span
                      className="
                        hidden
                        text-sm
                        font-semibold
                        text-gray-700
                        xl:block
                        dark:text-gray-300
                      "
                    >
                      {label}
                    </span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex shrink-0 md:hidden">
              <Modal>
                <Button
                  variant="primary"
                  isIconOnly
                  aria-label="Open tools"
                  className="
                    rounded-xl
                    border
                    border-gray-200
                    bg-gray-100
                    shadow-sm
                    hover:bg-gray-200
                    dark:border-gray-700
                    dark:bg-gray-800
                    dark:hover:bg-gray-700
                  "
                >
                  <span className="text-lg">☰</span>
                </Button>

                <Modal.Backdrop>
                  <Modal.Container className="w-[calc(100vw-2rem)] sm:max-w-sm">
                    <Modal.Dialog>
                      <Modal.CloseTrigger />
                      <Modal.Heading>Test Tools</Modal.Heading>
                      <Modal.Body className="gap-2">
                        {tools.map(
                          ({ icon, label, onPress, color, bgColor }) => (
                            <Button
                              key={label}
                              fullWidth
                              variant="primary"
                              onPress={onPress}
                              className={`
                                flex
                                items-center
                                justify-start
                                gap-3
                                rounded-xl
                                border
                                border-gray-200
                                px-4
                                py-3
                                dark:border-gray-700
                                ${bgColor}
                              `}
                            >
                              <span className={`text-xl ${color}`}>{icon}</span>
                              <span
                                className="
                                  font-semibold
                                  text-gray-700
                                  dark:text-gray-300
                                "
                              >
                                {label}
                              </span>
                            </Button>
                          ),
                        )}
                      </Modal.Body>
                    </Modal.Dialog>
                  </Modal.Container>
                </Modal.Backdrop>
              </Modal>
            </div>
          </div>
        </div>
      </header>

      <QuestionMapModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        totalQuestions={totalQuestions}
        currentQuestionIndex={currentQuestionIndex}
        questionIds={currentQuestions.map((q) => q.id)}
        answeredQuestions={answeredSet}
        flaggedQuestions={flaggedSet}
        onGoToQuestion={goToQuestion}
      />
    </>
  );
}