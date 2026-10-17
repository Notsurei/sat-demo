"use client";

import React from "react";
import { useAuthStore } from "@/zustand/auth-store";
import { Envelope, Comment } from "@gravity-ui/icons";
import { Button, Chip } from "@heroui/react";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";

const FEATURE_KEYS = [
  {
    key: "adaptiveLearning",
    icon: "✦",
    bg: "bg-indigo-50",
    iconBg: "bg-indigo-600",
    title: "text-indigo-900",
  },
  {
    key: "realisticTests",
    icon: "⚡",
    bg: "bg-cyan-50",
    iconBg: "bg-cyan-600",
    title: "text-cyan-900",
  },
  {
    key: "aiExplanations",
    icon: "💡",
    bg: "bg-amber-50",
    iconBg: "bg-amber-500",
    title: "text-amber-900",
  },
  {
    key: "progressDashboard",
    icon: "📈",
    bg: "bg-emerald-50",
    iconBg: "bg-emerald-600",
    title: "text-emerald-900",
  },
] as const;

const WHY_ITEMS = [
  {
    key: "focusedPractice",
    icon: "🎯",
    className: "bg-indigo-50 border-indigo-100",
    iconClass: "bg-indigo-600",
  },
  {
    key: "understandMistakes",
    icon: "💡",
    className: "bg-amber-50 border-amber-100",
    iconClass: "bg-amber-500",
  },
  {
    key: "actionableReports",
    icon: "📊",
    className: "bg-emerald-50 border-emerald-100",
    iconClass: "bg-emerald-600",
  },
] as const;

const DOMAIN_STATS = [
  { name: "Information and Ideas", value: 82, color: "bg-indigo-600" },
  { name: "Craft and Structure", value: 68, color: "bg-amber-500" },
  { name: "Expression of Ideas", value: 91, color: "bg-emerald-600" },
  {
    name: "Standard English Conventions",
    value: 74,
    color: "bg-blue-600",
  },
] as const;

export default function HomePage() {
  const router = useRouter();
  const t = useTranslations("home");

  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  React.useEffect(() => {
    checkAuth();
  }, []);

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        {t("loading")}
      </div>
    );
  }

  const year = new Date().getFullYear();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="relative overflow-hidden bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700">
                <span className="h-2 w-2 rounded-full bg-indigo-500" />
                {t("hero.badge")}
              </div>

              <h1 className="mt-7 text-5xl font-black leading-[1.05] tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
                {t("hero.titleLine1")}
                <br />
                <span className="text-indigo-600">
                  {t("hero.titleLine2")}
                </span>
              </h1>

              <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600 sm:text-xl">
                {t("hero.subtitle")}
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  variant="primary"
                  className="h-12 rounded-xl px-7 font-bold"
                  onPress={() => router.push("/pages/dashboard")}
                >
                  {t("hero.startPracticing")}
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-xl border-slate-200 bg-white px-7 font-semibold text-slate-700"
                  onPress={() => router.push("/pages/pricing")}
                >
                  {t("hero.explorePlans")}
                </Button>
              </div>

              <div className="mt-10 flex flex-wrap gap-8 border-t border-slate-100 pt-7">
                <div>
                  <p className="text-2xl font-black text-slate-900">1280</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {t("hero.stats.averagePracticeScore")}
                  </p>
                </div>

                <div>
                  <p className="text-2xl font-black text-slate-900">82%</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {t("hero.stats.averageAccuracy")}
                  </p>
                </div>

                <div>
                  <p className="text-2xl font-black text-slate-900">24/7</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {t("hero.stats.practiceAnytime")}
                  </p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        {t("hero.preview.sessionLabel")}
                      </p>

                      <h3 className="mt-1 text-2xl font-black text-slate-900">
                        {t("hero.preview.sessionTitle")}
                      </h3>
                    </div>

                    <Chip color="success">{t("hero.preview.practiceChip")}</Chip>
                  </div>

                  <div className="mt-8">
                    <p className="text-sm font-semibold text-indigo-600">
                      {t("hero.preview.domain")}
                    </p>

                    <p className="mt-3 text-xl font-bold leading-8 text-slate-900">
                      {t("hero.preview.prompt")}
                    </p>
                  </div>

                  <div className="mt-7 space-y-3">
                    {["A", "B", "C", "D"].map((option, index) => (
                      <div
                        key={option}
                        className={`rounded-xl border p-4 ${
                          index === 1
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold ${
                              index === 1
                                ? "bg-indigo-600 text-white"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {option}
                          </span>

                          <span className="text-sm font-medium text-slate-700">
                            {t("hero.preview.answerChoicePlaceholder")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-7 flex justify-end">
                    <Button variant="primary" className="rounded-xl px-6">
                      {t("hero.preview.submitAnswer")}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-5 -left-5 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                    ✓
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      {t("hero.preview.instantFeedback")}
                    </p>

                    <p className="font-bold text-slate-900">
                      {t("hero.preview.learnFromEveryAnswer")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-bold uppercase tracking-widest text-indigo-600">
              {t("features.label")}
            </span>

            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              {t("features.title")}
            </h2>

            <p className="mt-4 text-slate-500">{t("features.subtitle")}</p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURE_KEYS.map((feature) => (
              <div
                key={feature.key}
                className={`group rounded-3xl border border-slate-100 ${feature.bg} p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${feature.iconBg} text-xl text-white shadow-lg`}
                >
                  {feature.icon}
                </div>

                <h3 className={`mt-6 text-lg font-black ${feature.title}`}>
                  {t(`features.items.${feature.key}.title`)}
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {t(`features.items.${feature.key}.description`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-sm font-bold uppercase tracking-widest text-indigo-600">
              {t("whyStudyBuddy.label")}
            </span>

            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              {t("whyStudyBuddy.title")}
            </h2>

            <p className="mt-5 text-base leading-7 text-slate-500 sm:text-lg">
              {t("whyStudyBuddy.subtitle")}
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {WHY_ITEMS.map((feature) => (
              <div
                key={feature.key}
                className={`rounded-2xl border p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${feature.className}`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl text-white shadow-sm ${feature.iconClass}`}
                >
                  {feature.icon}
                </div>

                <h3 className="mt-6 text-xl font-black text-slate-900">
                  {t(`whyStudyBuddy.items.${feature.key}.title`)}
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {t(`whyStudyBuddy.items.${feature.key}.description`)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white">
            <div className="grid lg:grid-cols-2">
              <div className="p-8 lg:p-10">
                <span className="text-sm font-bold uppercase tracking-widest text-indigo-600">
                  {t("whyStudyBuddy.improvement.label")}
                </span>

                <h3 className="mt-3 text-2xl font-black text-slate-900 sm:text-3xl">
                  {t("whyStudyBuddy.improvement.title")}
                </h3>

                <p className="mt-4 max-w-xl leading-7 text-slate-500">
                  {t("whyStudyBuddy.improvement.description")}
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <Chip color="accent">
                    {t("whyStudyBuddy.improvement.chips.domainAnalysis")}
                  </Chip>
                  <Chip color="success">
                    {t("whyStudyBuddy.improvement.chips.accuracyTracking")}
                  </Chip>
                  <Chip color="warning">
                    {t("whyStudyBuddy.improvement.chips.difficultyBreakdown")}
                  </Chip>
                </div>
              </div>

              <div className="border-t border-slate-200 bg-slate-50 p-8 lg:border-l lg:border-t-0 lg:p-10">
                <p className="text-sm font-bold text-slate-500">
                  {t("whyStudyBuddy.improvement.examplePerformance")}
                </p>

                <div className="mt-6 space-y-5">
                  {DOMAIN_STATS.map((item) => (
                    <div key={item.name}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-700">
                          {item.name}
                        </span>

                        <span className="text-sm font-bold text-slate-900">
                          {item.value}%
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className={`h-full rounded-full ${item.color}`}
                          style={{ width: `${item.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-100 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="text-sm font-bold uppercase tracking-widest text-indigo-600">
                {t("contact.label")}
              </span>

              <h2 className="mt-3 text-3xl font-black text-slate-900 sm:text-4xl">
                {t("contact.titleLine1")}
                <br />
                {t("contact.titleLine2")}
              </h2>

              <p className="mt-5 max-w-xl text-base leading-7 text-slate-500">
                {t("contact.subtitle")}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  variant="primary"
                  size="lg"
                  onPress={() =>
                    window.open(
                      "https://mail.google.com/mail/?view=cm&fs=1&to=KhoiVo.7703@gmail.com&su=StudyBuddy%20Support&body=Hi%20StudyBuddy%20Team,%0A%0A",
                      "_blank",
                    )
                  }
                >
                  {t("contact.contactUs")}
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onPress={() => router.push("/pages/pricing")}
                >
                  {t("contact.viewPlans")}
                </Button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
              <p className="text-sm font-bold uppercase tracking-wider text-slate-400">
                {t("contact.infoLabel")}
              </p>

              <div className="mt-6 space-y-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                    <Envelope className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {t("contact.email")}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      KhoiVo.7703@gmail.com
                    </p>
                  </div>
                </div>

                <div className="h-px bg-slate-200" />

                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                    <Comment className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {t("contact.support")}
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {t("contact.supportDescription")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-7 rounded-2xl bg-white p-4">
                <p className="text-xs text-slate-400">
                  {t("contact.responseNote")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-gradient-to-r from-indigo-700 via-indigo-600 to-cyan-600 px-8 py-14 text-center text-white shadow-2xl sm:px-12">
          <div className="mx-auto max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-widest text-indigo-100">
              {t("cta.label")}
            </p>

            <h2 className="mt-3 text-3xl font-black sm:text-4xl">
              {t("cta.title")}
            </h2>

            <p className="mt-4 leading-7 text-indigo-100">
              {t("cta.description")}
            </p>

            <Button
              size="lg"
              className="mt-8 rounded-xl bg-white px-8 font-bold text-indigo-700 hover:bg-indigo-50"
              onPress={() => router.push("/pages/dashboard")}
            >
              {t("cta.startForFree")}
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-bold text-slate-900">{t("footer.brand")}</p>
            <p className="mt-1">{t("footer.tagline")}</p>
          </div>

          <div className="text-right">
            <p>{t("footer.copyright", { year })}</p>
            <p className="mt-1">{t("footer.slogan")}</p>
          </div>
        </div>
      </footer>
    </main>
  );
}