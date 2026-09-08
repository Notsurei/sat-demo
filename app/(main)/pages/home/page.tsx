"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/zustand/auth-store";
import { Envelope, Comment } from "@gravity-ui/icons";
import { Button, Chip } from "@heroui/react";

export default function HomePage() {
  const router = useRouter();

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
        Loading...
      </div>
    );
  }

  const features = [
    {
      title: "Adaptive Learning",
      description: "Personalized drills based on your weaknesses.",
    },
    {
      title: "Realistic Tests",
      description: "Full-length mocks with timing and scoring.",
    },
    {
      title: "AI Explanations",
      description: "Step-by-step reasoning for every question.",
    },
    {
      title: "Progress Dashboard",
      description: "Track strengths and measure growth over time.",
    },
  ];

  const studentsSay = [
    {
      quote:
        "StudyBuddy helped me raise my score by 150 points in two months — the AI explanations are gold.",
      author: "Sarah J.",
    },
    {
      quote: "The adaptive plan focused my practice and saved hours.",
      author: "Michael T.",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="relative overflow-hidden bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700">
                <span className="h-2 w-2 rounded-full bg-indigo-500" />
                Digital SAT Preparation
              </div>

              <h1 className="mt-7 text-5xl font-black leading-[1.05] tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
                Prepare smarter.
                <br />
                <span className="text-indigo-600">
                  Score higher.
                </span>
              </h1>

              <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600 sm:text-xl">
                Practice realistic SAT questions, understand your mistakes, and
                focus on the skills that matter most.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  variant="primary"
                  className="h-12 rounded-xl px-7 font-bold"
                  onPress={() => router.push("/pages/dashboard")}
                >
                  Start Practicing
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-xl border-slate-200 bg-white px-7 font-semibold text-slate-700"
                  onPress={() => router.push("/pages/pricing")}
                >
                  Explore Plans
                </Button>
              </div>

              <div className="mt-10 flex flex-wrap gap-8 border-t border-slate-100 pt-7">
                <div>
                  <p className="text-2xl font-black text-slate-900">1280</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Average practice score
                  </p>
                </div>

                <div>
                  <p className="text-2xl font-black text-slate-900">82%</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Average accuracy
                  </p>
                </div>

                <div>
                  <p className="text-2xl font-black text-slate-900">24/7</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Practice anytime
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
                        Practice Session
                      </p>

                      <h3 className="mt-1 text-2xl font-black text-slate-900">
                        Reading & Writing
                      </h3>
                    </div>

                    <Chip color="success">
                      Practice
                    </Chip>
                  </div>

                  <div className="mt-8">
                    <p className="text-sm font-semibold text-indigo-600">
                      Craft and Structure
                    </p>

                    <p className="mt-3 text-xl font-bold leading-8 text-slate-900">
                      Which choice best describes the relationship between the
                      passage and the author's argument?
                    </p>
                  </div>

                  <div className="mt-7 space-y-3">
                    {["A", "B", "C", "D"].map((option, index) => (
                      <div
                        key={option}
                        className={`rounded-xl border p-4 ${index === 1
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-slate-200 bg-white"
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold ${index === 1
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-100 text-slate-600"
                              }`}
                          >
                            {option}
                          </span>

                          <span className="text-sm font-medium text-slate-700">
                            Answer choice example
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-7 flex justify-end">
                    <Button
                      variant="primary"
                      className="rounded-xl px-6"
                    >
                      Submit Answer
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
                      Instant feedback
                    </p>

                    <p className="font-bold text-slate-900">
                      Learn from every answer
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
              Everything you need
            </span>

            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              A better way to prepare for the SAT
            </h2>

            <p className="mt-4 text-slate-500">
              Stop guessing what to study. Practice, understand your mistakes,
              and focus on the areas that matter most.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => {
              const styles = [
                {
                  icon: "✦",
                  bg: "bg-indigo-50",
                  iconBg: "bg-indigo-600",
                  title: "text-indigo-900",
                },
                {
                  icon: "⚡",
                  bg: "bg-cyan-50",
                  iconBg: "bg-cyan-600",
                  title: "text-cyan-900",
                },
                {
                  icon: "💡",
                  bg: "bg-amber-50",
                  iconBg: "bg-amber-500",
                  title: "text-amber-900",
                },
                {
                  icon: "📈",
                  bg: "bg-emerald-50",
                  iconBg: "bg-emerald-600",
                  title: "text-emerald-900",
                },
              ][index];

              return (
                <div
                  key={feature.title}
                  className={`group rounded-3xl border border-slate-100 ${styles.bg} p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${styles.iconBg} text-xl text-white shadow-lg`}
                  >
                    {styles.icon}
                  </div>

                  <h3 className={`mt-6 text-lg font-black ${styles.title}`}>
                    {feature.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {feature.description}
                  </p>

                  {/* <div className="mt-6 text-sm font-bold text-slate-700 transition-transform group-hover:translate-x-1">
                    Learn more →
                  </div> */}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-sm font-bold uppercase tracking-widest text-indigo-600">
              Why StudyBuddy
            </span>

            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Everything you need to prepare with confidence.
            </h2>

            <p className="mt-5 text-base leading-7 text-slate-500 sm:text-lg">
              Instead of simply giving you more questions, StudyBuddy helps you
              understand your performance and make every practice session count.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: "🎯",
                title: "Focused Practice",
                description:
                  "Practice by subject, domain, subtopic, and difficulty so you can spend more time on the skills that need attention.",
                className: "bg-indigo-50 border-indigo-100",
                iconClass: "bg-indigo-600",
              },
              {
                icon: "💡",
                title: "Understand Your Mistakes",
                description:
                  "Review your answers and explanations to understand why an answer is correct instead of simply seeing a score.",
                className: "bg-amber-50 border-amber-100",
                iconClass: "bg-amber-500",
              },
              {
                icon: "📊",
                title: "Actionable Reports",
                description:
                  "See your accuracy across domains, subtopics, and difficulty levels so you know what to practice next.",
                className: "bg-emerald-50 border-emerald-100",
                iconClass: "bg-emerald-600",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className={`rounded-2xl border p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${feature.className}`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl text-white shadow-sm ${feature.iconClass}`}
                >
                  {feature.icon}
                </div>

                <h3 className="mt-6 text-xl font-black text-slate-900">
                  {feature.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white">
            <div className="grid lg:grid-cols-2">
              <div className="p-8 lg:p-10">
                <span className="text-sm font-bold uppercase tracking-widest text-indigo-600">
                  Built for improvement
                </span>

                <h3 className="mt-3 text-2xl font-black text-slate-900 sm:text-3xl">
                  Know what to work on next.
                </h3>

                <p className="mt-4 max-w-xl leading-7 text-slate-500">
                  Your practice results are organized into useful insights instead
                  of leaving you with a single score. Identify weak areas, review
                  your mistakes, and use that information to guide your next
                  practice session.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <Chip color="accent">Domain Analysis</Chip>
                  <Chip color="success">Accuracy Tracking</Chip>
                  <Chip color="warning">Difficulty Breakdown</Chip>
                </div>
              </div>

              <div className="border-t border-slate-200 bg-slate-50 p-8 lg:border-l lg:border-t-0 lg:p-10">
                <p className="text-sm font-bold text-slate-500">
                  Example performance
                </p>

                <div className="mt-6 space-y-5">
                  {[
                    {
                      name: "Information and Ideas",
                      value: 82,
                      color: "bg-indigo-600",
                    },
                    {
                      name: "Craft and Structure",
                      value: 68,
                      color: "bg-amber-500",
                    },
                    {
                      name: "Expression of Ideas",
                      value: 91,
                      color: "bg-emerald-600",
                    },
                    {
                      name: "Standard English Conventions",
                      value: 74,
                      color: "bg-blue-600",
                    },
                  ].map((item) => (
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
                Get in touch
              </span>

              <h2 className="mt-3 text-3xl font-black text-slate-900 sm:text-4xl">
                Have a question?
                <br />
                We&apos;re here to help.
              </h2>

              <p className="mt-5 max-w-xl text-base leading-7 text-slate-500">
                Whether you have a question about practice, subscriptions, features,
                or found a problem, feel free to reach out to us.
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
                  Contact us
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onPress={() => router.push("/pages/pricing")}
                >
                  View plans
                </Button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
              <p className="text-sm font-bold uppercase tracking-wider text-slate-400">
                Contact information
              </p>

              <div className="mt-6 space-y-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                    <Envelope className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Email
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
                      Support
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Questions, feature requests, or bug reports are always
                      welcome.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-7 rounded-2xl bg-white p-4">
                <p className="text-xs text-slate-400">
                  We&apos;ll usually respond as soon as possible.
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
              Ready to improve?
            </p>

            <h2 className="mt-3 text-3xl font-black sm:text-4xl">
              Your next score improvement starts today.
            </h2>

            <p className="mt-4 leading-7 text-indigo-100">
              Start practicing for free and build a preparation plan around
              your goals.
            </p>

            <Button
              size="lg"
              className="mt-8 rounded-xl bg-white px-8 font-bold text-indigo-700 hover:bg-indigo-50"
              onPress={() => router.push("/pages/dashboard")}
            >
              Start For Free
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-bold text-slate-900">StudyBuddy</p>
            <p className="mt-1">
              Focused SAT preparation for ambitious students.
            </p>
          </div>

          <div className="text-right">
            <p>© {new Date().getFullYear()} StudyBuddy</p>
            <p className="mt-1">Practice smarter. Score higher.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
