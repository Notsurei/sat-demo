"use client";
import React from "react";
import { Button, Chip, Modal } from "@heroui/react";
import { usePracticeTimerStore } from "@/zustand/practice-timer";
import {
  Book,
  Calculator,
  House,
  Pencil,
  SquareListUl,
  ClockFill,
} from "@gravity-ui/icons";

interface PracticeHeaderProps {
  title: string;
  questionIndex?: number;
  totalQuestions?: number;
  subject?: string;
  category?: string;
  subtopic?: string;
  onHome: () => void;
  onAnnotate: () => void;
  onCalculator: () => void;
  onReference: () => void;
  onKnowledgeReview: () => void;
}

const subjectNameMap: Record<string, string> = {
  SAT_MATH: "Math",
  SAT_RW: "Reading & Writing",
  SAT_PRECALCULUS: "Precalculus",
  full: "Full Test",
};

export default function PracticeHeader({
  title,
  questionIndex = 0,
  totalQuestions = 0,
  subject,
  category,
  subtopic,
  onHome,
  onAnnotate,
  onCalculator,
  onReference,
  onKnowledgeReview,
}: PracticeHeaderProps) {
  const { seconds, isRunning, start, pause, reset } = usePracticeTimerStore();
  const tools = [
    {
      icon: <Pencil className="inline-block" />,
      label: "Annotate",
      onPress: onAnnotate,
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40"
    },
    {
      icon: <Calculator className="inline-block" />,
      label: "Calculator",
      onPress: onCalculator,
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40"
    },
    {
      icon: <SquareListUl className="inline-block" />,
      label: "Reference",
      onPress: onReference,
      color: "text-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/40"
    },
    {
      icon: <Book className="inline-block" />,
      label: "Knowledge",
      onPress: onKnowledgeReview,
      color: "text-pink-500",
      bgColor: "bg-pink-50 dark:bg-pink-900/20 hover:bg-pink-100 dark:hover:bg-pink-900/40"
    },
  ];

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  React.useEffect(() => {
    if (!isRunning && seconds === 0) {
      start();
    }
    return () => pause();
  }, []);

  const displaySubject = subject
    ? subjectNameMap[subject] || subject
    : "SAT Practice";

  const subtitleParts = [displaySubject];
  if (category) subtitleParts.push(category);
  if (subtopic) subtitleParts.push(subtopic);
  const subtitle = subtitleParts.join(" • ");

  return (

    <header className="sticky top-0 z-30 border-b border-gray-200 bg-gradient-to-r from-white via-blue-50/30 to-purple-50/30 shadow-lg backdrop-blur-md dark:border-gray-700 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
      <div className="mx-auto w-full px-3 sm:px-4 lg:px-6">
        <div className="flex min-h-16 flex-col justify-center gap-2 py-2 md:h-16 md:flex-row md:items-center md:justify-between md:gap-4 md:py-0">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <Modal>
              <Button
                variant="primary"
                isIconOnly
                className="shrink-0 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 px-3 py-2 text-white shadow-md transition-all duration-300 hover:from-blue-600 hover:to-blue-700"
              >
                <House className="h-5 w-5" />
              </Button>

              <Modal.Backdrop>
                <Modal.Container>
                  <Modal.Dialog className="w-[calc(100vw-2rem)] sm:max-w-[360px]">
                    <Modal.CloseTrigger />

                    <Modal.Heading>
                      Are you sure you want to exit?
                    </Modal.Heading>

                    <Modal.Body>
                      <p className="text-sm text-default-500">
                        Exiting will reset your current practice session and all
                        progress will be lost.
                      </p>
                    </Modal.Body>

                    <Modal.Footer>
                      <div className="flex w-full gap-2">
                        <Button
                          variant="outline"
                          fullWidth
                          onPress={() => {
                            pause();
                            reset();
                            onHome();
                          }}
                        >
                          Exit
                        </Button>

                        <Button
                          variant="primary"
                          fullWidth
                          onPress={() => {
                            start();
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </Modal.Footer>
                  </Modal.Dialog>
                </Modal.Container>
              </Modal.Backdrop>
            </Modal>

            <div className="hidden h-8 w-px shrink-0 bg-gradient-to-b from-transparent via-gray-300 to-transparent dark:via-gray-600 sm:block" />

            <div className="min-w-0 flex-1">
              <h1 className="truncate bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-sm font-black text-transparent sm:text-base">
                {title}
              </h1>

              <div className="mt-0.5 flex items-center gap-1 overflow-hidden text-xs font-semibold">
                <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  {displaySubject}
                </span>

                {category && (
                  <span className="max-w-[100px] truncate rounded-full bg-purple-100 px-2 py-0.5 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 sm:max-w-[140px]">
                    {category}
                  </span>
                )}

                {subtopic && (
                  <span className="hidden max-w-[140px] truncate rounded-full bg-pink-100 px-2 py-0.5 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300 sm:inline-block">
                    {subtopic}
                  </span>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center md:hidden">
              <Modal>
                <Button
                  variant="primary"
                  isIconOnly
                  className="rounded-xl border border-gray-200 bg-gray-100 px-3 py-2 shadow-md hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
                >
                  <span className="text-lg">⚙️</span>
                </Button>

                <Modal.Backdrop>
                  <Modal.Container className="w-[calc(100vw-2rem)] sm:max-w-xs">
                    <Modal.Dialog>
                      <Modal.CloseTrigger />

                      <Modal.Heading>Tools</Modal.Heading>

                      <Modal.Body className="gap-2">
                        {tools.map(
                          ({ icon, label, onPress, color, bgColor }) => (
                            <Button
                              key={label}
                              fullWidth
                              variant="primary"
                              onPress={onPress}
                              className={`flex items-center justify-start gap-3 border border-gray-200 px-4 py-3 dark:border-gray-700 ${bgColor}`}
                            >
                              <span className={`text-xl ${color}`}>
                                {icon}
                              </span>

                              <span className="font-semibold text-gray-700 dark:text-gray-300">
                                {label}
                              </span>
                            </Button>
                          )
                        )}
                      </Modal.Body>
                    </Modal.Dialog>
                  </Modal.Container>
                </Modal.Backdrop>
              </Modal>
            </div>
          </div>

          <div className="order-2 flex shrink-0 items-center justify-center gap-2 md:order-none md:gap-4">

            <div className="flex items-center whitespace-nowrap rounded-full border border-blue-200 bg-gradient-to-r from-blue-100 to-blue-200 px-3 py-1.5 text-sm font-bold text-blue-700 shadow-md dark:border-blue-700 dark:from-blue-900/40 dark:to-blue-800/40 dark:text-blue-300 sm:px-4">
              <span className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text font-black text-transparent">
                Q {questionIndex + 1}
              </span>

              <span className="mx-1 text-blue-500 dark:text-blue-400">
                /
              </span>

              <span className="text-blue-600 dark:text-blue-300">
                {totalQuestions}
              </span>
            </div>

            <div className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-green-200 bg-gradient-to-r from-green-100 to-emerald-100 px-3 py-1.5 font-mono text-sm font-bold text-green-700 shadow-md transition-all duration-300 hover:shadow-lg dark:border-green-700 dark:from-green-900/40 dark:to-emerald-800/40 dark:text-green-300 sm:gap-2 sm:px-4">
              <ClockFill className="h-4 w-4 shrink-0" />

              <span className="font-black text-green-600 dark:text-green-300">
                {formatTime(seconds)}
              </span>
            </div>
          </div>

          <div className="hidden min-w-0 flex-1 justify-end md:flex">
            <div className="flex items-center gap-2">
              {tools.map(({ icon, label, onPress, color, bgColor }) => (
                <Button
                  key={label}
                  variant="primary"
                  onPress={onPress}
                  className={`flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 shadow-md transition-all duration-300 hover:shadow-lg dark:border-gray-700 ${bgColor}`}
                >
                  <span className={`text-lg ${color}`}>
                    {icon}
                  </span>

                  <span className="hidden text-sm font-semibold text-gray-700 dark:text-gray-300 xl:block">
                    {label}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

    </header>
  );

}