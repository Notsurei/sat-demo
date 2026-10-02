"use client";

import { Tabs } from "@heroui/react";

import RecentPracticeHistory from "@/app/components/history/practice-history";
import RecentFullTestHistory from "@/app/components/history/full-test-history";

import {
  PracticeHistory,
} from "../hooks/use-dashboard-data";

import { FullTestHistory } from "@/app/(main)/pages/full-test-report-history/components/type";

interface DashboardHistoryProps {
  practiceHistory: PracticeHistory[];
  fullTestHistory: FullTestHistory[];
  practiceLoading: boolean;
  fullTestLoading: boolean;
}

export default function DashboardHistory({
  practiceHistory,
  fullTestHistory,
  practiceLoading,
  fullTestLoading,
}: DashboardHistoryProps) {
  const items = [
    {
      id: "Practice History",
      content: (
        <RecentPracticeHistory
          history={practiceHistory}
          loading={practiceLoading}
        />
      ),
    },
    {
      id: "Full test History",
      content: (
        <RecentFullTestHistory
          history={fullTestHistory}
          loading={fullTestLoading}
        />
      ),
    },
  ];

  return (
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
  );
}

