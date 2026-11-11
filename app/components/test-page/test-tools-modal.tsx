"use client";

import React from "react";
import FloatingCalculator from "@/app/components/floating-calculator/floating-calculator";
import ReferenceSheetModal from "@/app/components/modal-button/reference-sheet-modal";

interface TestToolModalsProps {
  showCalculator: boolean;
  onCalculatorClose: () => void;
  showReference: boolean;
  onReferenceChange: (v: boolean) => void;
}

export default function TestToolModals({
  showCalculator,
  onCalculatorClose,
  showReference,
  onReferenceChange,
}: TestToolModalsProps) {
  return (
    <>
      {showCalculator && <FloatingCalculator onClose={onCalculatorClose} />}
      <ReferenceSheetModal
        isOpen={showReference}
        onOpenChange={onReferenceChange}
      />
    </>
  );
}