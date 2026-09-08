// components/annotator/hooks/useAnnotator.ts
import { useState, useCallback } from "react";
import { AnnotatorState, AnnotMode, HighlightColor, DrawColor } from "../types";

export function useAnnotator(initialPassageId?: string) {
  const [state, setState] = useState<AnnotatorState>({
    mode: "none",
    color: "yellow",
    passageId: initialPassageId || null,
  });

  const setMode = useCallback(
    (mode: AnnotMode, color: HighlightColor | DrawColor) => {
      setState((prev) => ({ ...prev, mode, color }));
    },
    [],
  );

  const reset = useCallback(() => {
    setState({ mode: "none", color: "yellow", passageId: null });
  }, []);

  return { state, setMode, reset };
}
