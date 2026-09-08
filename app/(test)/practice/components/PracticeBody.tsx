"use client";

import React from "react";
import { Button, Input, TextArea } from "@heroui/react";
import { Bulb, Check, Xmark } from "@gravity-ui/icons";
import Annotator from "@/app/components/annotator";
import MathText from "@/app/components/LaText/MathJax";
import { hintLibrary } from "@/config/hint_library";
import { rwProTips, mathCommonTraps } from "@/config/knowledge_db";
import clsx from "clsx";
import ParsedMathText from "@/app/components/LaText/ParsedText";

interface Option {
  id: string;
  label: string;
  content: string;
}

interface PracticeMainProps {
  passageContent: string | null;
  showAnnotator: boolean;
  onToggleAnnotator: () => void;

  currentQuestion: number;
  totalQuestions: number;
  prompt: string;
  type: "MCQ" | "GRID_IN" | "text";
  options?: Option[];
  explanation?: string | null;

  selectedOption?: string;
  textAnswer?: string;
  onOptionSelect: (optionId: string) => void;
  onTextChange: (value: string) => void;

  showHint: boolean;
  hintContent?: string | null;

  showFeedback: boolean;
  isCorrect: boolean;
  feedbackMessage: string;
  disabled: boolean;

  domain?: string;
  subtopic?: string;
  correctAnswer?: string;
  timeSpent?: number;
}

export default function PracticeMain({
  passageContent,
  showAnnotator,
  onToggleAnnotator,
  currentQuestion,
  totalQuestions,
  prompt,
  type,
  options,
  selectedOption,
  textAnswer,
  onOptionSelect,
  onTextChange,
  showHint,
  hintContent,
  showFeedback,
  isCorrect,
  feedbackMessage,
  disabled,
  explanation,
  domain,
  subtopic,
  correctAnswer,
  timeSpent,
}: PracticeMainProps) {
  const [struckOptions, setStruckOptions] = React.useState<Set<string>>(
    new Set(),
  );

  const toggleStrikeThrough = (optionId: string) => {
    setStruckOptions((prev) => {
      const next = new Set(prev);
      if (next.has(optionId)) {
        next.delete(optionId);
      } else {
        next.add(optionId);
      }
      return next;
    });
  };

  React.useEffect(() => {
    setStruckOptions(new Set());
  }, [currentQuestion]);

  const getHints = (): string[] => {
    if (subtopic && hintLibrary[subtopic]) {
      return hintLibrary[subtopic];
    }
    if (hintContent) {
      return [hintContent];
    }
    return [];
  };

  const hints = getHints();

  const renderProTip = () => {
    const rwDomains = [
      "Craft and Structure",
      "Information and Ideas",
      "Standard English Conventions",
      "Expression of Ideas",
    ];
    const mathDomains = [
      "Algebra",
      "Advanced Math",
      "Geometry",
      "Problem Solving and Data Analysis",
      "Precalculus",
    ];
    const isRW = rwDomains.includes(domain || "");
    const isMath = mathDomains.includes(domain || "");

    let tip = "";
    let trap = "";

    if (isRW && subtopic && rwProTips[subtopic]) {
      const data = rwProTips[subtopic];
      tip = data.tip;
      trap = data.trap;
    } else if (isMath && subtopic && mathCommonTraps[subtopic]) {
      trap = mathCommonTraps[subtopic];
    }

    if (!tip && !trap) return null;

    return (
      <div className="mt-3 space-y-2">
        {tip && (
          <div className="rounded border-l-4 border-primary bg-primary-50 p-3 text-sm dark:bg-primary-950">
            <p className="font-semibold text-primary">
              💡 Pro Tip — {subtopic}:
            </p>
            <p className="text-default-700 dark:text-default-300">{tip}</p>
          </div>
        )}
        {trap && (
          <div className="rounded border-l-4 border-warning bg-warning-50 p-3 text-sm dark:bg-warning-950">
            <p className="font-semibold text-warning">⚠️ Common Trap:</p>
            <p className="text-default-700 dark:text-default-300">{trap}</p>
          </div>
        )}
      </div>
    );
  };

  const renderInput = () => {
    if (type === "MCQ" && options) {
      return (
        <div className="space-y-3">
          {options.map((opt) => {
            const isSelected = selectedOption === opt.id;
            const isStruck = struckOptions.has(opt.id);

            const isOptionDisabled = disabled || isStruck;

            return (
              <div
                key={opt.id}
                role="button"
                tabIndex={isOptionDisabled ? -1 : 0}
                onClick={() => {
                  if (!isOptionDisabled) {
                    onOptionSelect(opt.id);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isOptionDisabled) {
                    onOptionSelect(opt.id);
                  }
                }}
                className={`
        group
        flex items-center justify-between
        rounded-xl border
        px-4 py-3
        select-none
        transition-all duration-200 ease-out

        ${!isOptionDisabled ? "cursor-pointer active:scale-[0.98]" : ""}

        ${isSelected
                    ? "border-primary bg-primary-50 shadow-lg ring-2 ring-primary/20 dark:bg-primary/15"
                    : "border-default-200 bg-white hover:border-primary/60 hover:bg-default-100 hover:shadow-md dark:border-default-700 dark:bg-default-900 dark:hover:bg-default-800"
                  }

        ${isStruck ? "opacity-50" : ""}

        ${disabled ? "pointer-events-none" : ""}
      `}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`
            flex h-8 w-8 items-center justify-center
            rounded-full
            border
            font-semibold
            transition-all

            ${isSelected
                        ? "border-primary bg-primary text-green-400"
                        : "border-default-300 bg-default-100 group-hover:border-primary"
                      }
          `}
                  >
                    {opt.label}
                  </div>

                  <div className="relative flex-1">
                    <div
                      className={`
              transition-opacity
              ${isStruck ? "opacity-40" : ""}
            `}
                    >
                      <ParsedMathText text={opt.content} />
                    </div>

                    {isStruck && (
                      <span
                        className="
                pointer-events-none
                absolute inset-x-0 top-1/2
                h-[2px]
                -translate-y-1/2
                rounded-full
                bg-black/60
              "
                      />
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={isStruck ? "danger" : "outline"}
                    // isDisabled={disabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStrikeThrough(opt.id);
                    }}
                    className="min-w-[60px]"
                  >
                    {isStruck ? <Xmark /> : <span className="text-xs line-through">ABC</span>}
                  </Button>

                  <div
                    className={`
                      ml-2 flex h-7 w-7 items-center justify-center
                      rounded-full
                      border-2
                      transition-all duration-200

                      ${isSelected
                        ? "border-success bg-white text-success scale-100 opacity-100"
                        : "border-default-300 bg-transparent scale-75 opacity-0"
                      }
                    `}
                  >
                    <Check className="h-4 w-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    if (type === "GRID_IN") {
      return (
        <div className="max-w-sm space-y-2">
          <Input
            value={textAnswer ?? ""}
            placeholder="Enter your answer"
            onChange={(e) => onTextChange(e.target.value)}
            type="text"
          />
        </div>
      );
    }

    return (
      <TextArea
        className="w-full rounded-lg border border-default-200 p-3 dark:border-default-700 dark:bg-default-800"
        rows={4}
        placeholder="Type your answer..."
        value={textAnswer || ""}
        onChange={(e) => onTextChange(e.target.value)}
        disabled={disabled}
      />
    );
  };
  return (
    <div className="flex flex-col lg:flex-row flex-1 overflow-hidden max-h-[calc(100vh-100px)]">
      <div
        className={clsx(
          "w-full lg:w-1/2 overflow-y-auto",
          "border-b lg:border-b-0 lg:border-r border-default-200",
          "bg-white dark:border-default-700 dark:bg-default-800",
          "px-8 py-7",
        )}
      >
        {passageContent ? (
          <div className="h-full">
            <Annotator
              passageId={`passage-${currentQuestion}`}
              enabled={true}
              isOpen={showAnnotator}
              onToggle={onToggleAnnotator}
            >
              <ParsedMathText text={passageContent} />
            </Annotator>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-default-400">
            <p className="text-center text-sm italic">
              No passage provided for this question.
            </p>
          </div>
        )}
      </div>

      <div className="w-full lg:w-1/2 overflow-y-auto bg-default-50 p-6 dark:bg-default-900">
        <div className="q-bar mb-4 flex items-center justify-between">
          <span className="font-bold text-default-600 dark:text-default-300">
            Question {currentQuestion + 1} of {totalQuestions}
          </span>
        </div>

        <div className="mb-4 text-lg font-semibold text-foreground">
          <ParsedMathText text={prompt} />
        </div>

        <div className="mb-4">{renderInput()}</div>

        {showHint && hints.length > 0 && (
          <div className="hint-container mb-4 rounded-lg border border-warning-300 bg-warning-50 p-4 dark:border-warning-700 dark:bg-warning-950/30">
            <p className="mb-2 text-sm font-semibold text-warning-700 dark:text-warning-300 flex items-center gap-2">
              <Bulb /> Hints:
            </p>
            <ul className="space-y-1.5 text-sm text-default-700 dark:text-default-300">
              {hints.map((hint, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary font-medium">{index + 1}.</span>
                  <span>
                    <ParsedMathText text={hint} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {showFeedback && (
          <div
            className={`mb-4 rounded-lg border p-4 ${isCorrect
              ? "border-success bg-success-100 dark:border-success-600 dark:bg-success-900/30"
              : "border-danger bg-danger-100 dark:border-danger-600 dark:bg-danger-900/30"
              }`}
          >
            <div className="flex items-start justify-between">
              <p className="font-semibold text-default-800 dark:text-default-100 flex items-center gap-2">
                {isCorrect ? (
                  <>
                    <Check /> Correct!
                  </>
                ) : (
                  <>
                    <Xmark /> Incorrect
                  </>
                )}
              </p>
              {timeSpent !== undefined && (
                <span className="text-sm text-default-500">⏱ {timeSpent}s</span>
              )}
            </div>

            {correctAnswer && (
              <p className="mt-1 text-sm text-default-700 dark:text-default-300">
                <strong>Correct answer:</strong> {correctAnswer}
              </p>
            )}

            {explanation && (
              <div className="mt-3 rounded bg-default-100 p-3 text-sm text-default-700 dark:bg-default-800 dark:text-default-300">
                <strong>Explanation:</strong>

                <div className="mt-1 whitespace-pre-wrap">
                  <ParsedMathText text={explanation} />
                </div>
              </div>
            )}

            {renderProTip()}
          </div>
        )}
      </div>
    </div>
  );
}
