"use client";

import React from "react";

import { Button, Modal } from "@heroui/react";
import { Check, Flag } from "@gravity-ui/icons";

import clsx from "clsx";

interface QuestionMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalQuestions: number;
  currentQuestionIndex: number;
  questionIds?: string[];
  answeredQuestions: Set<string>;
  flaggedQuestions: Set<string>;
  onGoToQuestion: (index: number) => void;
}

export default function QuestionMapModal({
  isOpen,
  onClose,
  totalQuestions,
  currentQuestionIndex,
  questionIds = [],
  answeredQuestions,
  flaggedQuestions,
  onGoToQuestion,
}: QuestionMapModalProps) {
  const handleQuestionClick = (index: number) => {
    onGoToQuestion(index);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="w-[calc(100vw-2rem)] max-w-2xl">
            <Modal.CloseTrigger />

            <Modal.Header>
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-bold">Question Map</h2>

                <p className="text-sm text-default-500">
                  Select a question to jump directly to it.
                </p>
              </div>
            </Modal.Header>

            <Modal.Body>
              {/* Legend */}
              <div className="mb-4 flex flex-wrap gap-x-4 gap-y-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-orange-300" />
                  <span>Current</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-green-500" />
                  <span>Answered</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-yellow-500" />
                  <span>Flagged</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-default-300" />
                  <span>Unanswered</span>
                </div>
              </div>

              {/* Questions */}
              <div className="grid grid-cols-5 gap-3 sm:grid-cols-8 md:grid-cols-10">
                {Array.from({ length: totalQuestions }, (_, index) => {
                  const questionKey = questionIds[index] ?? String(index);

                  const isCurrent = index === currentQuestionIndex;
                  const isAnswered = answeredQuestions.has(questionKey);
                  const isFlagged = flaggedQuestions.has(questionKey);

                  return (
                    <button
                      key={questionKey}
                      type="button"
                      aria-label={`Go to question ${index + 1}`}
                      aria-current={isCurrent ? "true" : undefined}
                      onClick={() => handleQuestionClick(index)}
                      className={clsx(
                        "relative flex h-11 w-11 items-center justify-center rounded-lg",
                        "border-2 text-sm font-bold transition-all cursor-pointer",
                        "hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/50",
                        isAnswered && [
                          "border-green-500",
                          "bg-green-500",
                          "text-white",
                          "shadow-md",
                          "dark:border-green-500",
                          "dark:bg-green-500",
                          "dark:text-white",
                        ],

                        // Flagged but unanswered
                        !isAnswered &&
                          isFlagged && [
                            "border-yellow-500",
                            "bg-yellow-50",
                            "text-yellow-700",
                            "dark:bg-yellow-900/30",
                            "dark:text-yellow-300",
                          ],

                        // Current but unanswered and not flagged
                        !isAnswered &&
                          !isFlagged &&
                          isCurrent && [
                            "border-orange-500",
                            "bg-orange-300",
                            "text-orange-950",
                            "shadow-md",
                            "dark:border-orange-400",
                            "dark:bg-orange-500",
                            "dark:text-white",
                          ],

                        // Unanswered
                        !isAnswered &&
                          !isFlagged &&
                          !isCurrent && [
                            "border-default-200",
                            "bg-default-50",
                            "text-default-700",
                            "hover:bg-default-100",
                            "dark:border-default-700",
                            "dark:bg-default-900/30",
                            "dark:text-default-200",
                          ],
                      )}
                    >
                      {index + 1}

                      {/* Flagged marker */}
                      {isFlagged && (
                        <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-yellow-500">
                          <Flag className="h-3 w-3 text-white" />
                        </span>
                      )}

                      {/* Answered marker */}
                      {!isFlagged && isAnswered && (
                        <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-green-500">
                          <Check className="h-3 w-3 text-white" />
                        </span>
                      )}

                      {/* Current marker */}
                      {!isFlagged && !isAnswered && isCurrent && (
                        <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-background bg-orange-500">
                          <span className="h-1.5 w-1.5 rounded-full bg-white" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Progress */}
              <div className="mt-5 border-t border-default-200 pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-default-500">Progress</span>

                  <span className="font-semibold">
                    {answeredQuestions.size} / {totalQuestions} answered
                  </span>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-default-200">
                  <div
                    className="h-full rounded-full bg-green-500 transition-all"
                    style={{
                      width:
                        totalQuestions > 0
                          ? `${Math.min(
                              (answeredQuestions.size / totalQuestions) * 100,
                              100,
                            )}%`
                          : "0%",
                    }}
                  />
                </div>
              </div>
            </Modal.Body>

            <Modal.Footer>
              <Button variant="outline" onPress={onClose}>
                Close
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

