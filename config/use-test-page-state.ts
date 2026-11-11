import { useState } from "react";
import type { ConfirmConfig } from "@/types/test-page";

export function useTestPageState() {
  const [showAnnotator, setShowAnnotator] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showReference, setShowReference] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<ConfirmConfig | null>(
    null,
  );

  const askConfirm = (config: ConfirmConfig) => setConfirmConfig(config);
  const closeConfirm = () => setConfirmConfig(null);

  return {
    showAnnotator,
    setShowAnnotator,
    isSubmitting,
    setIsSubmitting,
    showCalculator,
    setShowCalculator,
    showReference,
    setShowReference,
    confirmConfig,
    askConfirm,
    closeConfirm,
  };
}