"use client";

import { Button, Card, Chip } from "@heroui/react";
import { useTranslations } from "next-intl";
import { Rocket } from "@gravity-ui/icons";

import { useRouter } from "@/i18n/navigation";
import type { PracticeHistory } from "../hooks/use-dashboard-data";
import { DOMAIN_TO_KEY } from "@/app/[locale]/(main)/pages/dashboard/hooks/domain_mapping";

const WEAK_THRESHOLD = 75;
const MAX_RECOMMENDATIONS = 3;

const FALLBACK_RECOMMENDATIONS = [
  { key: "practiceMath", icon: "📐", target: "/pages/practice?subject=SAT_MATH" },
  {
    key: "practiceReadingWriting",
    icon: "📖",
    target: "/pages/practice?subject=SAT_RW",
  },
  { key: "takeFullPractice", icon: "🎯", target: "/pages/practice?mode=full" },
] as const;

interface DomainAggregate {
  domain: string;
  correct: number;
  total: number;
  accuracy: number;
  sampleCount: number;
}

function aggregateByDomain(history: PracticeHistory[]): DomainAggregate[] {
  const map = new Map<string, { correct: number; total: number; count: number }>();

  history.forEach((p) => {
    const domain = p.domain?.trim();
    if (!domain) return;
    if (p.status !== "DONE" && p.status !== "COMPLETED") return;

    const prev = map.get(domain) ?? { correct: 0, total: 0, count: 0 };
    map.set(domain, {
      correct: prev.correct + (p.correctAnswers ?? 0),
      total: prev.total + (p.totalQuestions ?? 0),
      count: prev.count + 1,
    });
  });

  return Array.from(map.entries())
    .map(([domain, s]) => ({
      domain,
      correct: s.correct,
      total: s.total,
      accuracy: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
      sampleCount: s.count,
    }))
    .sort((a, b) => a.accuracy - b.accuracy);
}

interface RecommendedPracticeProps {
  practiceHistory?: PracticeHistory[];
}

export default function RecommendedPractice({
  practiceHistory = [],
}: RecommendedPracticeProps) {
  const router = useRouter();
  const t = useTranslations("dashboard.recommended");

  const weakDomains = aggregateByDomain(practiceHistory).filter(
    (d) => d.accuracy < WEAK_THRESHOLD && d.total > 0,
  );

  const hasRecommendations = weakDomains.length > 0;

  const recommendations = hasRecommendations
    ? weakDomains.slice(0, MAX_RECOMMENDATIONS).map((d) => ({
        key: DOMAIN_TO_KEY[d.domain] ?? null,
        domain: d.domain,
        accuracy: d.accuracy,
        icon: "🎯",
        target: `/pages/practice?domain=${encodeURIComponent(d.domain)}`,
      }))
    : FALLBACK_RECOMMENDATIONS.map((r) => ({
        key: r.key,
        domain: null,
        accuracy: null,
        icon: r.icon,
        target: r.target,
      }));

  return (
    <section className="mt-8">
      <Card className="border border-default-200 bg-background shadow-sm">
        <Card.Header className="border-b border-default-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Rocket width={20} />
            </div>

            <div>
              <h2 className="text-lg font-semibold leading-tight">
                {t("title")}
              </h2>

              <p className="mt-1 text-sm leading-relaxed text-default-500">
                {hasRecommendations
                  ? t("subtitleWeak")
                  : t("subtitle")}
              </p>
            </div>
          </div>
        </Card.Header>

        <Card.Content className="p-6">
          <div className="grid gap-4 md:grid-cols-3">
            {recommendations.map((item, idx) => {
              if (hasRecommendations && item.key && item.domain) {
                return (
                  <div
                    key={item.domain}
                    className="flex flex-col rounded-2xl border border-amber-200 bg-amber-50 p-5 transition-all hover:border-amber-300 hover:bg-amber-100/50 hover:shadow-sm dark:border-amber-800 dark:bg-amber-950/20"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-background text-2xl shadow-sm">
                        {item.icon}
                      </div>

                      <Chip
                        size="sm"
                        variant="primary"
                        color="warning"
                        className="font-semibold"
                      >
                        {item.accuracy}%
                      </Chip>
                    </div>

                    <h3 className="mt-5 font-semibold leading-tight">
                      {item.domain}
                    </h3>

                    <p className="mt-1 flex-1 text-sm leading-relaxed text-default-500">
                      {t(`domainTips.${item.key}`)}
                    </p>

                    <Button
                      className="mt-5 w-full"
                      variant="primary"
                      onPress={() => router.push(item.target)}
                    >
                      {t("startPractice")}
                    </Button>
                  </div>
                );
              }

              if (!hasRecommendations && item.key) {
                return (
                  <div
                    key={item.key}
                    className="flex flex-col rounded-2xl border border-default-200 bg-default-50 p-5 transition-all hover:border-primary-200 hover:bg-background hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-background text-2xl shadow-sm">
                        {item.icon}
                      </div>

                      <Chip size="sm" variant="primary" color="default">
                        {t(`items.${item.key}.duration`)}
                      </Chip>
                    </div>

                    <h3 className="mt-5 font-semibold leading-tight">
                      {t(`items.${item.key}.title`)}
                    </h3>

                    <p className="mt-1 flex-1 text-sm leading-relaxed text-default-500">
                      {t(`items.${item.key}.description`)}
                    </p>

                    <Button
                      className="mt-5 w-full"
                      variant="primary"
                      onPress={() => router.push(item.target)}
                    >
                      {t("startPractice")}
                    </Button>
                  </div>
                );
              }

              return null;
            })}
          </div>
        </Card.Content>
      </Card>
    </section>
  );
}