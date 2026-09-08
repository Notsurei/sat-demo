"use client";

import { ArrowLeft, Check } from "@gravity-ui/icons";
import { Button } from "@heroui/react";

interface PracticeFooterProps {
  onCheck: () => void;
  onHint: () => void;
  hasHint: boolean;
  showHint: boolean;
  onPrev: () => void;
  isPrevDisabled: boolean;
  onNext: () => void;
  showNext: boolean;
  nextLabel: string;
  isNextDisabled?: boolean;
  canCheck: boolean;
}

export default function PracticeFooter({
  onCheck,
  onHint,
  hasHint,
  showHint,
  onPrev,
  isPrevDisabled,
  onNext,
  showNext,
  nextLabel,
  isNextDisabled = false,
  canCheck,
}: PracticeFooterProps) {
  return (
    <footer className="flex items-center justify-between border-t border-default-200 bg-white px-6 py-3 dark:border-default-700 dark:bg-default-800">
      <div className="flex gap-2">
        <Button
          variant="primary"
          onPress={onCheck}
          isDisabled={!canCheck}
          className="flex items-center gap-2"
        >
          <Check className="inline-block" /> <span>Check Answer</span>
        </Button>
        {/* <Button variant="outline" onPress={onHint} isDisabled={!hasHint}>
                    💡 {showHint ? 'Hide Hint' : 'Show Hint'}
                </Button> */}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onPress={onPrev} isDisabled={isPrevDisabled}>
          <ArrowLeft className="inline-block" /> Back
        </Button>
        {showNext && (
          <Button
            variant="outline"
            onPress={onNext}
            isDisabled={isNextDisabled}
          >
            {nextLabel}
          </Button>
        )}
      </div>
    </footer>
  );
}
