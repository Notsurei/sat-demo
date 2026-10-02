"use client";

import React from "react";
import { Button, Input } from "@heroui/react";
import { Check, Flag, Xmark } from "@gravity-ui/icons";
import Annotator from "@/app/components/annotator";
import clsx from "clsx";
import ParsedMathText from "@/app/components/LaText/ParsedText";
import MathText from "@/app/components/LaText/MathJax";

interface Option {
  id: string;
  label: string;
  content: string;
}

interface FullTestMainProps {
  passageContent: string | null;

  showAnnotator: boolean;
  onToggleAnnotator: () => void;

  currentQuestion: number;
  totalQuestions: number;

  prompt: string;

  type: "MCQ" | "GRID_IN";

  options?: Option[];

  selectedOption?: string;
  textAnswer?: string;

  flagged?: boolean;

  onOptionSelect: (optionId: string) => void;
  onTextChange: (value: string) => void;

  onToggleFlag: () => void;

  disabled?: boolean;
}

export default function FullTestMain({
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
  flagged = false,
  onOptionSelect,
  onTextChange,
  onToggleFlag,
  disabled = false,
}: FullTestMainProps) {
  const [struckOptions, setStruckOptions] = React.useState<Set<string>>(
    new Set(),
  );

  React.useEffect(() => {
    setStruckOptions(new Set());
  }, [currentQuestion]);

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
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !isOptionDisabled) {
                    onOptionSelect(opt.id);
                  }
                }}
                className={clsx(
                  "group flex items-center justify-between",
                  "rounded-xl border",
                  "px-4 py-3",
                  "select-none",
                  "transition-all duration-200 ease-out",

                  !isOptionDisabled && "cursor-pointer active:scale-[0.98]",

                  isSelected
                    ? "border-primary bg-primary-50 shadow-lg ring-2 ring-primary/20 dark:bg-primary/15"
                    : "border-default-200 bg-white hover:border-primary/60 hover:bg-default-100 hover:shadow-md dark:border-default-700 dark:bg-default-900 dark:hover:bg-default-800",

                  isStruck && "opacity-50",

                  disabled && "pointer-events-none",
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={clsx(
                      "flex h-8 w-8 items-center justify-center",
                      "rounded-full",
                      "border",
                      "font-semibold",
                      "transition-all",

                      isSelected
                        ? "border-primary bg-primary text-white"
                        : "border-default-300 bg-default-100 group-hover:border-primary",
                    )}
                  >
                    {opt.label}
                  </div>

                  <div className="relative flex-1">
                    <div
                      className={clsx(
                        "transition-opacity",
                        isStruck && "opacity-40",
                      )}
                    >
                      <ParsedMathText text={opt.content} />
                    </div>

                    {isStruck && (
                      <span
                        className="
                          pointer-events-none
                          absolute
                          inset-x-0
                          top-1/2
                          h-[2px]
                          -translate-y-1/2
                          rounded-full
                          bg-black/60
                          dark:bg-white/60
                        "
                      />
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={isStruck ? "danger" : "outline"}
                    isDisabled={disabled}
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleStrikeThrough(opt.id);
                    }}
                    className="min-w-[60px]"
                  >
                    {isStruck ? (
                      <Xmark />
                    ) : (
                      <span className="text-xs line-through">ABC</span>
                    )}
                  </Button>

                  <div
                    className={clsx(
                      "ml-2 flex h-7 w-7 items-center justify-center",
                      "rounded-full",
                      "border-2",
                      "transition-all duration-200",

                      isSelected
                        ? "scale-100 border-success bg-white text-success opacity-100"
                        : "scale-75 border-default-300 bg-transparent opacity-0",
                    )}
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
            onChange={(event) => onTextChange(event.target.value)}
            type="text"
          />

          <p className="text-xs text-default-500">
            Enter your answer using numbers, decimals, or fractions.
          </p>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex max-h-[calc(100vh-100px)] flex-1 flex-col overflow-hidden lg:flex-row">
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
              passageId={`full-test-passage-${currentQuestion}`}
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

      <div className="w-full overflow-y-auto bg-default-50 p-6 dark:bg-default-900 lg:w-1/2">
        <div className="mx-auto w-full max-w-3xl">
          <div className="q-bar mb-4 flex items-center justify-between">
            <span className="font-bold text-default-600 dark:text-default-300">
              Question {currentQuestion + 1} of {totalQuestions}
            </span>

            <Button
              variant={flagged ? "primary" : "outline"}
              isIconOnly
              aria-label={
                flagged ? "Remove flag from question" : "Flag question"
              }
              onPress={onToggleFlag}
              isDisabled={disabled}
              className={clsx(
                "rounded-xl",
                flagged
                  ? "bg-warning text-white"
                  : "border-default-200 bg-white dark:bg-default-800",
              )}
            >
              <Flag className="h-5 w-5" />
            </Button>
          </div>

          <div className="mb-4 text-lg font-semibold text-foreground">
            <MathText text={prompt} />
          </div>

          <div className="mb-4">{renderInput()}</div>
        </div>
      </div>
    </div>
  );
}
