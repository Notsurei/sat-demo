"use client";

import { useTranslations } from "next-intl";
import type { DomainAnalysis } from "@/app/[locale]/(main)/pages/dashboard/hooks/domain_mapping";

interface PriorityFocusAreasProps {
  weakDomains: DomainAnalysis[];
}

const TIP_KEYS: Record<string, string> = {
  "Craft and Structure": "craftAndStructure",
  "Information and Ideas": "informationAndIdeas",
  "Standard English Conventions": "standardEnglishConventions",
  "Expression of Ideas": "expressionOfIdeas",
  Algebra: "algebra",
  "Advanced Math": "advancedMath",
  Geometry: "geometry",
  "Problem Solving and Data Analysis": "problemSolvingAndData",
};

export default function PriorityFocusAreas({
  weakDomains,
}: PriorityFocusAreasProps) {
  const t = useTranslations("practiceReport.priorityFocus");

  if (weakDomains.length === 0) {
    return (
      <div className="rounded-xl border-l-4 border-emerald-500 bg-emerald-50 p-4 dark:bg-emerald-950/20">
        <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
          🌟 {t("excellentTitle")}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-emerald-700 dark:text-emerald-400">
          {t("excellentDescription")}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-l-4 border-amber-500 bg-amber-50 p-4 dark:bg-amber-950/20">
      <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
        ⚠️ {t("title")}
      </p>

      <ul className="mt-3 space-y-3">
        {weakDomains.map(({ domain, accuracy }) => {
          const tipKey = TIP_KEYS[domain];

          return (
            <li key={domain}>
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                • {domain} — {accuracy}%
              </p>

              {tipKey && (
                <p className="ml-4 mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  → {t(`tips.${tipKey}`)}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-4 border-t border-amber-300 pt-3 dark:border-amber-700">
        <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
          🎯 <strong>{t("nextStep")}</strong>
        </p>
      </div>
    </div>
  );
}