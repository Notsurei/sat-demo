import { WEAK_THRESHOLD } from "./domain_mapping";

interface DomainStats {
  correct: number;
  total: number;
  subtopics?: Record<string, { correct: number; total: number }>;
}

export interface DomainAnalysis {
  domain: string;
  accuracy: number;
  isWeak: boolean;
  level: "mastered" | "developing" | "weak";
}

export const analyzeDomains = (
  stats: Record<string, DomainStats>,
): DomainAnalysis[] => {
  return Object.entries(stats).map(([domain, s]) => {
    const accuracy =
      s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;

    return {
      domain,
      accuracy,
      isWeak: accuracy < WEAK_THRESHOLD,
      level:
        accuracy >= 75 ? "mastered" : accuracy >= 55 ? "developing" : "weak",
    };
  });
};