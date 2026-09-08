"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/zustand/auth-store";
import { Card, Button, Chip, Tabs } from "@heroui/react";
import ToDoList from "@/app/components/to-do-list/to-do-list";
import KnowledgeModal from "@/app/components/modal-button/knowledge-modal";
import TestModeModal from "@/app/components/modal-button/test-mode-modal";

import {
  TargetDart,
  ChartColumnStacked,
  PencilToLine,
  Thunderbolt,
  ArrowRight,
  Clock,
  CircleCheck,
  BookOpen,
  Rocket,
} from "@gravity-ui/icons";
import axios from "axios";
import ResetSmartMemory from "@/app/components/modal-button/reset-smart-memory";
import RecentPracticeHistory from "@/app/components/history/practice-history";

interface PracticeHistory {
  id: string;
  subject: string;
  domain?: string | null;
  subtopic?: string | null;
  totalQuestions: number;
  correctAnswers: number;
  score?: number | null;
  timeSpent?: number | null;
  startedAt: string;
  completedAt?: string | null;
  mode: string;
  status: string;
}

const recommendations = [
  {
    icon: "📐",
    title: "Practice Math",
    description: "Improve your problem-solving skills.",
    duration: "20 min",
  },
  {
    icon: "📖",
    title: "Practice Reading & Writing",
    description: "Strengthen your reading and grammar.",
    duration: "25 min",
  },
  {
    icon: "🎯",
    title: "Take a Full Practice",
    description: "Test your overall SAT performance.",
    duration: "45 min",
  },
];

export default function Dashboard() {
  const router = useRouter();

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [history, setHistory] = React.useState<PracticeHistory[]>([]);
  const [historyLoading, setHistoryLoading] = React.useState(true);

  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const items = [
    { id: "Practice History", content: <RecentPracticeHistory history={history} loading={historyLoading} /> },
    { id: "Full test History", content: <div>Full test history content</div> },
  ]

  React.useEffect(() => {
    checkAuth();
  }, []);

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, router]);

  React.useEffect(() => {
    if (!isAuthenticated) return;

    const fetchHistory = async () => {
      setHistoryLoading(true);

      try {
        const response = await axios.get("/api/practice/history");

        const data = response.data;

        if (!data.success || !Array.isArray(data.data)) {
          setHistory([]);
          return;
        }

        setHistory(data.data.slice(0, 5));
      } catch (error) {
        console.error("Failed to fetch practice history:", error);
        setHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchHistory();
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-default-500">Loading your dashboard...</p>
      </main>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const stats = React.useMemo(() => {
    const completedPractices = history.filter(
      (practice) => practice.status === "DONE",
    );

    const totalSessions = history.length;

    const latestPractice = completedPractices[0];

    const currentScore =
      latestPractice?.score !== null &&
        latestPractice?.score !== undefined
        ? latestPractice.score
        : "--";

    const totalCorrect = completedPractices.reduce(
      (total, practice) => total + (practice.correctAnswers || 0),
      0,
    );

    const totalQuestions = completedPractices.reduce(
      (total, practice) => total + (practice.totalQuestions || 0),
      0,
    );

    const accuracy =
      totalQuestions > 0
        ? Math.round((totalCorrect / totalQuestions) * 100)
        : 0;

    return [
      {
        label: "Current Score",
        value: currentScore,
        trend: latestPractice
          ? "Latest practice"
          : "No completed tests",
        icon: <TargetDart className="h-6 w-6" />,
        iconClass: "bg-danger/10 text-danger",
      },
      {
        label: "Accuracy",
        value: `${accuracy}%`,
        trend:
          totalQuestions > 0
            ? `${totalCorrect}/${totalQuestions} correct`
            : "No data yet",
        icon: <ChartColumnStacked className="h-6 w-6" />,
        iconClass: "bg-success/10 text-success",
      },
      {
        label: "Practice Sessions",
        value: totalSessions,
        trend:
          totalSessions > 0
            ? `${completedPractices.length} completed`
            : "No sessions yet",
        icon: <PencilToLine className="h-6 w-6" />,
        iconClass: "bg-primary/10 text-primary",
      },
      {
        label: "Study Streak",
        value: "Coming soon",
        trend: "Keep practicing!",
        icon: <Thunderbolt className="h-6 w-6" />,
        iconClass: "bg-warning/10 text-warning",
      },
    ];
  }, [history]);

  return (
    <main className="min-h-screen bg-default-50 text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <section className="mb-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Chip size="sm" variant="primary">
                  SAT Dashboard
                </Chip>

                <Chip size="sm" variant="primary" color="accent">
                  {user?.subscriptionPlan || "FREE"}
                </Chip>
              </div>

              <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">
                Hello, {user?.firstName || "there"} 👋
              </h1>

              <p className="mt-2 max-w-2xl text-default-500">
                Keep practicing and review your recent performance to improve
                your SAT score.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <TestModeModal />

              <Button variant="outline" onPress={() => setIsModalOpen(true)}>
                📋 Knowledge Review
              </Button>

              <KnowledgeModal
                isOpen={isModalOpen}
                onOpenChange={setIsModalOpen}
              />
            </div>
          </div>
        </section>

        <section className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card
              key={stat.label}
              className="border border-default-200 bg-background shadow-sm"
            >
              <Card.Content className="p-5">
                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.iconClass}`}
                  >
                    {stat.icon}
                  </div>

                  <span className="text-xs text-default-400">{stat.trend}</span>
                </div>

                <p className="mt-5 text-2xl font-bold">{stat.value}</p>

                <p className="mt-1 text-sm text-default-500">{stat.label}</p>
              </Card.Content>
            </Card>
          ))}
        </section>
        <div className="space-y-6">
          <ResetSmartMemory />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-10">
            <div className="w-full lg:col-span-6">
              <Tabs
                className="w-full"
                aria-label="Practice history tabs"
              >
                <div className="relative w-full overflow-x-auto scrollbar-hide">
                  <Tabs.List className="flex w-full gap-1">
                    {items.map((item) => (
                      <Tabs.Tab
                        key={item.id}
                        id={item.id}
                        className={[
                          "relative flex min-w-0 flex-1",
                          "items-center justify-center gap-2",
                          "rounded-xl px-4 py-2.5",
                          "text-sm font-medium",
                          "text-default-500",
                          "transition-all duration-200",
                          "hover:bg-background hover:text-foreground",
                          "data-[selected=true]:bg-background",
                          "data-[selected=true]:text-primary",
                          "data-[selected=true]:shadow-sm",
                        ].join(" ")}
                      >
                        {item.id}
                      </Tabs.Tab>
                    ))}
                  </Tabs.List>
                </div>

                {items.map((item) => (
                  <Tabs.Panel
                    key={item.id}
                    id={item.id}
                    className="w-full pt-4"
                  >
                    {item.content}
                  </Tabs.Panel>
                ))}
              </Tabs>
            </div>

            <div className="w-full lg:col-span-4">
              <Card className="h-full border border-default-200 bg-background shadow-sm">
                <Card.Header className="border-b border-default-200 px-6 py-5">
                  <div>
                    <h2 className="text-lg font-semibold">
                      Today&apos;s Tasks
                    </h2>

                    <p className="mt-1 text-sm text-default-500">
                      Stay consistent with your preparation.
                    </p>
                  </div>
                </Card.Header>

                <Card.Content className="p-5">
                  <ToDoList />
                </Card.Content>
              </Card>
            </div>
          </div>
        </div>

        <section className="mt-8">
          <Card className="border border-default-200 bg-background shadow-sm">
            <Card.Header className="border-b border-default-200 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Rocket width={20} />
                </div>

                <div>
                  <h2 className="text-lg font-semibold">
                    Recommended Practice
                  </h2>

                  <p className="mt-1 text-sm text-default-500">
                    Choose what you want to work on next.
                  </p>
                </div>
              </div>
            </Card.Header>

            <Card.Content className="p-6">
              <div className="grid gap-4 md:grid-cols-3">
                {recommendations.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-default-200 bg-default-50 p-5 transition-all hover:border-primary-200 hover:bg-background hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-background text-2xl shadow-sm">
                        {item.icon}
                      </div>

                      <Chip size="sm" variant="primary" color="default">
                        {item.duration}
                      </Chip>
                    </div>

                    <h3 className="mt-5 font-semibold">{item.title}</h3>

                    <p className="mt-1 text-sm leading-6 text-default-500">
                      {item.description}
                    </p>

                    <Button
                      className="mt-5 w-full"
                      variant="primary"
                      onPress={() => router.push("/pages/practice")}
                    >
                      Start Practice
                    </Button>
                  </div>
                ))}
              </div>
            </Card.Content>
          </Card>
        </section>

        {user?.subscriptionPlan === "FREE" && (
          <section className="mt-6">
            <Card className="border border-primary-200 bg-primary-50 shadow-sm">
              <Card.Content className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-primary">
                    <CircleCheck width={20} />
                  </div>

                  <div>
                    <p className="font-semibold text-primary-900">
                      You&apos;re using the Free plan
                    </p>

                    <p className="mt-1 text-sm text-primary-700">
                      Your dashboard keeps your 5 most recent practice sessions.
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="primary"
                  onPress={() => router.push("/pages/pricing")}
                >
                  Upgrade Plan
                </Button>
              </Card.Content>
            </Card>
          </section>
        )}
      </div>
    </main>
  );
}
