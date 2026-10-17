"use client";

import React from "react";
import { Button, Card, Spinner } from "@heroui/react";
import { useTranslations } from "next-intl";

import { title, subtitle } from "@/app/components/primitives";
import { useAuthStore } from "@/zustand/auth-store";
import { useRouter } from "@/i18n/navigation";
import AuthModal from "@/app/components/modal-button/auth-modal";

const TRUST_BADGE_KEYS = [
  "realisticTestFormat",
  "trustedStudyExperience",
  "clearScoreGrowth",
] as const;

const EXAM_FOCUSED_ITEMS = ["practice", "review", "progress"] as const;

// const STAT_KEYS = [
//   { value: "15,000+", labelKey: "questions" },
//   { value: "300+", labelKey: "mockTests" },
//   { value: "98%", labelKey: "studentSatisfaction" },
//   { value: "24/7", labelKey: "aiTutorSupport" },
// ] as const;

const FEATURE_ITEMS = [
  {
    key: "digitalSatPractice",
    icon: (
      <img
        src="https://storage.freeicon.com/free-education-icon-29L5IPjQRlGa"
        alt="laptop icon"
        width="64"
        height="64"
      />
    ),
  },
  {
    key: "guidedExplanations",
    icon: (
      <img
        src="https://storage.freeicon.com/free-091593134635-icon--s9MeaVfr2vc"
        alt="growth icon"
        width="64"
        height="64"
      />
    ),
  },
  {
    key: "fullLengthMockExams",
    icon: (
      <img
        src="https://storage.freeicon.com/free-clipboard-icon-RcpuqZqUzdXN"
        alt="clipboard icon"
        width="64"
        height="64"
      />
    ),
  },
] as const;

const STEP_KEYS = ["practice", "review", "improve"] as const;

const WHY_BADGE_KEYS = [
  "clearLearningGoals",
  "strongProgressTracking",
  "calmExamPreparation",
] as const;

export default function Landing() {
  const [_isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);
  const router = useRouter();
  const t = useTranslations("landing");

  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  React.useEffect(() => {
    checkAuth();
  }, []);

  React.useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/pages/home");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,_#f4f9ff_0%,_#eef5ff_45%,_#ffffff_100%)]">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" color="accent" />
          <p className="text-sm text-slate-500">{t("loading")}</p>
        </div>
      </section>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <section className="min-h-screen bg-[linear-gradient(135deg,_#f4f9ff_0%,_#eef5ff_45%,_#ffffff_100%)] px-4 py-10 text-slate-900 sm:px-6 lg:px-8 lg:py-14">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <div className="overflow-hidden rounded-[2rem] border border-blue-100 bg-white shadow-[0_25px_80px_rgba(15,23,42,0.08)]">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
            <div className="bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_55%)] p-8 sm:p-10 lg:p-14">
              <div className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-700">
                {t("badge")}
              </div>

              <div className="mt-8 max-w-2xl">
                <h1 className={title({ color: "blue", size: "lg" })}>
                  {t("title")}
                </h1>
                <p className={subtitle({ class: "mt-6 max-w-2xl text-left" })}>
                  {t("subtitle")}
                </p>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  variant="primary"
                  size="lg"
                  onPress={() => setIsAuthModalOpen(true)}
                >
                  {t("actions.startLearning")}
                </Button>
                <Button variant="outline" size="lg">
                  {t("actions.explorePrepTools")}
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap gap-4 text-sm text-slate-600">
                {TRUST_BADGE_KEYS.map((key) => (
                  <span
                    key={key}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1"
                  >
                    {t(`trustBadges.${key}`)}
                  </span>
                ))}
              </div>
            </div>

            {/* Dark panel */}
            <div className="border-t border-blue-100 bg-slate-950 p-8 text-white sm:p-10 lg:border-l lg:border-t-0 lg:p-14">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-6 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-200">
                  {t("examFocused.label")}
                </p>
                <h2 className="mt-3 text-2xl font-semibold leading-tight">
                  {t("examFocused.title")}
                </h2>
                <ul className="mt-6 space-y-3 text-sm text-slate-200">
                  {EXAM_FOCUSED_ITEMS.map((key) => (
                    <li key={key} className="flex gap-3">
                      <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-300" />
                      <span className="leading-relaxed">
                        {t(`examFocused.items.${key}`)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {STAT_KEYS.map((stat) => (
            <Card
              key={stat.labelKey}
              className="border border-slate-200 bg-white/90 shadow-sm"
            >
              <Card.Content className="px-6 py-6">
                <h3 className="text-3xl font-bold leading-tight text-slate-900">
                  {stat.value}
                </h3>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-slate-600">
                  {t(`stats.${stat.labelKey}`)}
                </p>
              </Card.Content>
            </Card>
          ))}
        </div> */}

        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-sm sm:p-10">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
              {t("featuresSection.label")}
            </p>
            <h2 className="mt-3 text-2xl font-bold leading-tight tracking-tight text-slate-900 sm:text-3xl">
              {t("featuresSection.title")}
            </h2>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {FEATURE_ITEMS.map((feature) => (
              <div
                key={feature.key}
                className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-6"
              >
                <div className="flex h-10 w-10 items-center justify-center text-sm font-semibold text-blue-700">
                  {feature.icon}
                </div>
                <h3 className="mt-4 text-lg font-semibold leading-tight text-slate-900">
                  {t(`featuresSection.${feature.key}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {t(`featuresSection.${feature.key}.description`)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-sm sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
              {t("howItWorks.label")}
            </p>
            <div className="mt-6 space-y-4">
              {STEP_KEYS.map((key) => (
                <div
                  key={key}
                  className="rounded-[1rem] border border-slate-200 bg-slate-50 p-5"
                >
                  <h3 className="text-lg font-semibold leading-tight text-slate-900">
                    {t(`howItWorks.${key}.title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {t(`howItWorks.${key}.text`)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-blue-100 bg-gradient-to-br from-[#0f4c81] to-[#1d72b8] p-8 text-white shadow-[0_20px_50px_rgba(29,114,184,0.25)] sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-100">
              {t("whyStudents.label")}
            </p>
            <h2 className="mt-3 text-2xl font-bold leading-tight sm:text-3xl">
              {t("whyStudents.title")}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-blue-50 sm:text-base">
              {t("whyStudents.description")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {WHY_BADGE_KEYS.map((key) => (
                <span
                  key={key}
                  className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm"
                >
                  {t(`whyStudents.badges.${key}`)}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-8 text-center shadow-sm sm:p-10">
          <h2 className="text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">
            {t("cta.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
            {t("cta.description")}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button
              variant="primary"
              size="lg"
              onPress={() => setIsAuthModalOpen(true)}
            >
              {t("actions.getStarted")}
            </Button>
            <Button variant="outline" size="lg">
              {t("actions.viewFeatures")}
            </Button>
          </div>
        </div>
      </div>

      <AuthModal />
    </section>
  );
}