"use client";

import React from "react";
import { Button, Card, Spinner } from "@heroui/react";
import { title, subtitle } from "@/app/components/primitives";
import { useAuthStore } from "@/zustand/auth-store";
import { useRouter } from "next/navigation";
import AuthModal from "@/app/components/modal-button/auth-modal";

const features = [
  {
    icon: (
      <img
        src="https://storage.freeicon.com/free-education-icon-29L5IPjQRlGa"
        alt="laptop icon"
        width="64"
        height="64"
      />
    ),
    title: "Digital SAT practice",
    description:
      "Access realistic reading and math questions built to mirror the actual exam experience.",
  },
  {
    icon: (
      <img
        src="https://storage.freeicon.com/free-091593134635-icon--s9MeaVfr2vc"
        alt="growth icon"
        width="64"
        height="64"
      />
    ),
    title: "Guided explanations",
    description:
      "Receive clear, step-by-step reasoning and feedback for every mistake you make.",
  },
  {
    icon: (
      <img
        src="https://storage.freeicon.com/free-clipboard-icon-RcpuqZqUzdXN"
        alt="clipboard icon"
        width="64"
        height="64"
      />
    ),
    title: "Full-length mock exams",
    description:
      "Train under timed conditions with adaptive practice sets that reflect the official format.",
  },
];

const stats = [
  ["15,000+", "questions"],
  ["300+", "mock tests"],
  ["98%", "student satisfaction"],
  ["24/7", "AI tutor support"],
];

const steps = [
  {
    title: "1. Practice",
    text: "Work through authentic SAT-style questions with a calm, exam-focused experience.",
  },
  {
    title: "2. Review",
    text: "Understand each mistake with concise feedback that explains the reasoning clearly.",
  },
  {
    title: "3. Improve",
    text: "Build confidence through repeated practice and measurable progress over time.",
  },
];

export default function Home() {
  const [_isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);
  const router = useRouter();
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  // ✅ Gọi checkAuth bất kể có token hay không (dựa trên cookie)
  React.useEffect(() => {
    checkAuth();
  }, []); // Chỉ chạy 1 lần khi mount

  // ✅ Chỉ redirect sau khi loading hoàn tất và đã xác thực
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
          <p className="text-sm text-slate-500">Loading...</p>
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
              <div className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
                College Board-style SAT prep
              </div>

              <div className="mt-8 max-w-2xl">
                <h1 className={title({ color: "blue", size: "lg" })}>
                  Prepare for the Digital SAT with clarity and confidence.
                </h1>
                <p className={subtitle({ class: "mt-6 max-w-2xl text-left" })}>
                  Practice with realistic questions, learn from targeted
                  feedback, and build the skills that matter on test day.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  variant="primary"
                  size="lg"
                  onPress={() => setIsAuthModalOpen(true)}
                >
                  Start learning
                </Button>
                <Button variant="outline" size="lg">
                  Explore prep tools
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap gap-4 text-sm text-slate-600">
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                  Realistic test format
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                  Trusted study experience
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                  Clear score growth
                </span>
              </div>
            </div>

            <div className="border-t border-blue-100 bg-slate-950 p-8 text-white sm:p-10 lg:border-l lg:border-t-0 lg:p-14">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-6 backdrop-blur">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-200">
                  Exam-focused practice
                </p>
                <h2 className="mt-3 text-2xl font-semibold leading-tight">
                  Built for students who want a calm, structured path to
                  stronger scores.
                </h2>
                <ul className="mt-6 space-y-3 text-sm text-slate-200">
                  <li className="flex gap-3">
                    <span className="mt-0.5 h-2.5 w-2.5 rounded-full bg-blue-300" />
                    Practice in a clean, distraction-free environment.
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-0.5 h-2.5 w-2.5 rounded-full bg-blue-300" />
                    Review each answer with direct explanations and next steps.
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-0.5 h-2.5 w-2.5 rounded-full bg-blue-300" />
                    Monitor your progress and focus on what matters most.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map(([value, label]) => (
            <Card
              key={label}
              className="border border-slate-200 bg-white/90 shadow-sm"
            >
              <Card.Content className="px-6 py-6">
                <h3 className="text-3xl font-semibold text-slate-900">
                  {value}
                </h3>
                <p className="mt-2 text-sm uppercase tracking-[0.2em] text-slate-600">
                  {label}
                </p>
              </Card.Content>
            </Card>
          ))}
        </div>

        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-sm sm:p-10">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-700">
              Everything you need
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">
              A structured platform for focused SAT preparation.
            </h2>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-6"
              >
                <div className="flex h-10 w-10 items-center justify-center text-sm font-semibold text-blue-700">
                  {feature.icon}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-sm sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-700">
              How it works
            </p>
            <div className="mt-6 space-y-4">
              {steps.map((step) => (
                <div
                  key={step.title}
                  className="rounded-[1rem] border border-slate-200 bg-slate-50 p-5"
                >
                  <h3 className="text-lg font-semibold text-slate-900">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {step.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-blue-100 bg-gradient-to-br from-[#0f4c81] to-[#1d72b8] p-8 text-white shadow-[0_20px_50px_rgba(29,114,184,0.25)] sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-100">
              Why students prefer this approach
            </p>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
              Study with structure, not noise.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-50 sm:text-base">
              The experience is designed to feel focused and encouraging, with
              clear goals, useful feedback, and a polished learning path from
              first question to final review.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm">
                Clear learning goals
              </span>
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm">
                Strong progress tracking
              </span>
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm">
                Calm exam preparation
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-8 text-center shadow-sm sm:p-10">
          <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
            Ready to begin your SAT preparation journey?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Start with a focused practice session and build confidence one step
            at a time.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button
              variant="primary"
              size="lg"
              onPress={() => setIsAuthModalOpen(true)}
            >
              Get started
            </Button>
            <Button variant="outline" size="lg">
              View features
            </Button>
          </div>
        </div>
      </div>

      <AuthModal />
    </section>
  );
}
