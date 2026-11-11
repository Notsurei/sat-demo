import { useMemo } from "react";

interface AnswerLike {
  optionId?: string | null;
  textAnswer?: string | null;
}

export function useTestHeaderAdapter({
  answers,
  flaggedQuestions,
}: {
  answers: Record<string, AnswerLike>;
  flaggedQuestions: Record<string, boolean>;
}) {
  const answeredSet = useMemo(
    () =>
      new Set(
        Object.entries(answers)
          .filter(([, a]) => Boolean(a?.optionId || a?.textAnswer?.trim()))
          .map(([qid]) => qid),
      ),
    [answers],
  );

  const flaggedSet = useMemo(
    () =>
      new Set(
        Object.entries(flaggedQuestions)
          .filter(([, f]) => f)
          .map(([qid]) => qid),
      ),
    [flaggedQuestions],
  );

  return { answeredSet, flaggedSet };
}