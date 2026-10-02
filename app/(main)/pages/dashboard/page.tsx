"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/zustand/auth-store";
import ResetSmartMemory from "@/app/components/modal-button/reset-smart-memory";
import DashboardHeader from "./components/dashboard-header";
import DashboardStats from "./components/dashboard-stats";
import DashboardHistory from "./components/dashboard-history";
import DashboardTasks from "./components/dashboard-task";
import RecommendedPractice from "./components/recommended-practice";
import DashboardUpgradeBanner from "./components/dashboard-upgrade-banner";

import { useDashboardData } from "./hooks/use-dashboard-data";
import DashboardProgressChart from "./components/dashboard-progress-chart";

export default function Dashboard() {
  const router = useRouter();

  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();

  const [isKnowledgeModalOpen, setIsKnowledgeModalOpen] = React.useState(false);

  React.useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  React.useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, router]);

  const { practiceHistory, fullTestHistory, practiceLoading, fullTestLoading } =
    useDashboardData(isAuthenticated, isLoading);

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

  return (
    <main className="min-h-screen bg-default-50 text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <DashboardHeader
          firstName={user?.firstName}
          subscriptionPlan={user?.subscriptionPlan}
          isKnowledgeModalOpen={isKnowledgeModalOpen}
          onKnowledgeModalChange={setIsKnowledgeModalOpen}
        />

        <DashboardStats history={practiceHistory} />

        <DashboardProgressChart
          practiceHistory={practiceHistory}
          fullTestHistory={fullTestHistory}
        />

        <div className="space-y-6">
          <ResetSmartMemory />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-10">
            <div className="w-full lg:col-span-6">
              <DashboardHistory
                practiceHistory={practiceHistory}
                fullTestHistory={fullTestHistory}
                practiceLoading={practiceLoading}
                fullTestLoading={fullTestLoading}
              />
            </div>

            <div className="w-full lg:col-span-4">
              <DashboardTasks />
            </div>
          </div>
        </div>

        <RecommendedPractice />

        <DashboardUpgradeBanner subscriptionPlan={user?.subscriptionPlan} />
      </div>
    </main>
  );
}
