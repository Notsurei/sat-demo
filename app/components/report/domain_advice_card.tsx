"use client";

import { useTranslations } from "next-intl";

interface Strategy {
  title: string;
  text: string;
}

interface DomainAdviceCardProps {
  domainKey: string;
  accuracy?: number;
}

export default function DomainAdviceCard({
  domainKey,
  accuracy,
}: DomainAdviceCardProps) {
  const t = useTranslations(`practiceReport.domainAdvice.${domainKey}`);
  const strategies = t.raw("strategies") as Strategy[];

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800 dark:bg-blue-950/20">
      <div className="flex items-start gap-3">
        <span className="shrink-0 text-2xl">{t("icon")}</span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-semibold leading-snug text-blue-900 dark:text-blue-200">
              {t("what")}
            </p>

            {accuracy !== undefined && (
              <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-300">
                {accuracy}%
              </span>
            )}
          </div>

          <ul className="mt-3 space-y-2.5">
            {strategies.map((strategy, i) => (
              <li
                key={i}
                className="text-xs leading-relaxed text-slate-700 dark:text-slate-300"
              >
                <span className="font-semibold text-slate-900 dark:text-white">
                  {strategy.title}:
                </span>{" "}
                <span>{strategy.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}