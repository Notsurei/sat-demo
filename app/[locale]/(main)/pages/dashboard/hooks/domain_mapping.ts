export const DOMAIN_TO_KEY: Record<string, string> = {
  "Craft and Structure": "craftAndStructure",
  "Information and Ideas": "informationAndIdeas",
  "Standard English Conventions": "standardEnglishConventions",
  "Expression of Ideas": "expressionOfIdeas",
  Algebra: "algebra",
  "Advanced Math": "advancedMath",
  Geometry: "geometry",
  "Problem Solving and Data Analysis": "problemSolvingAndData",
};

export const WEAK_THRESHOLD = 75;

export interface DomainAnalysis {
  domain: string;
  domainKey: string | null;
  accuracy: number;
  correct: number;
  total: number;
  isWeak: boolean;
}

export interface DomainStatInput {
  domain: string;
  correct: number;
  total: number;
  accuracy?: number;
}

export const analyzeDomains = (
  domains: DomainStatInput[],
): DomainAnalysis[] => {
  if (!Array.isArray(domains)) return [];

  return domains
    .map((d) => {
      const accuracy =
        d.accuracy ??
        (d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0);

      return {
        domain: d.domain,
        domainKey: DOMAIN_TO_KEY[d.domain] ?? null,
        accuracy,
        correct: d.correct,
        total: d.total,
        isWeak: accuracy < WEAK_THRESHOLD && d.total > 0,
      };
    })
    .sort((a, b) => a.accuracy - b.accuracy);
};