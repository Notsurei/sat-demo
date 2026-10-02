"use client";

import { ArrowLeft, Flag, ArrowRight, Check } from "@gravity-ui/icons";
import { Button, Spinner } from "@heroui/react";

interface FullTestFooterProps {
  onPrev: () => void;
  onNext: () => void;
  onSubmitSection: () => void;

  isPrevDisabled: boolean;
  isNextDisabled?: boolean;

  isModuleCompleted?: boolean;

  isFlagged: boolean;
  onToggleFlag: () => void;

  isSubmitting?: boolean;
  unansweredCount?: number;
}

export default function FullTestFooter({
  onPrev,
  onNext,
  onSubmitSection,
  isPrevDisabled,
  isNextDisabled = false,
  isModuleCompleted = false,
  isFlagged,
  onToggleFlag,
  isSubmitting = false,
  unansweredCount = 0,
}: FullTestFooterProps) {
  return (
    <footer className="flex items-center justify-between border-t border-default-200 bg-white px-6 py-3 dark:border-default-700 dark:bg-default-800">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onPress={onToggleFlag}
          isDisabled={isSubmitting}
          className={`flex items-center gap-2 ${
            isFlagged ? "border-warning text-warning" : ""
          }`}
        >
          <Flag className="inline-block" />
          <span>{isFlagged ? "Unmark" : "Mark for Review"}</span>
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          onPress={onPrev}
          isDisabled={isPrevDisabled || isSubmitting}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="inline-block" />
          <span>Back</span>
        </Button>

        <Button
          variant="outline"
          onPress={onNext}
          isDisabled={isNextDisabled || isSubmitting}
          className="flex items-center gap-2"
        >
          <span>Next</span>
          <ArrowRight className="inline-block" />
        </Button>

        {isModuleCompleted && (
          <Button
            variant="primary"
            onPress={onSubmitSection}
            isDisabled={isSubmitting}
            className="min-w-[180px] flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Spinner size="sm" color="current" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Check className="inline-block" />
                <span>Submit Module</span>
              </>
            )}
          </Button>
        )}
      </div>
    </footer>
  );
}