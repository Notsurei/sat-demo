"use client";

import React from "react";
import {
  Thunderbolt,
  Check,
  ChartColumnStacked,
  Cup,
} from "@gravity-ui/icons";

import SummaryCard from "@/app/components/history/summary-card";

interface FullTestHistorySummaryProps {
  totalTests: number;
  completedTests: number;
  averageAccuracy: number;
  averageScaledScore: number | null;
}

export default function FullTestHistorySummary({
  totalTests,
  completedTests,
  averageAccuracy,
  averageScaledScore,
}: FullTestHistorySummaryProps) {
  const cardContent = [
    {
      icon: <Thunderbolt width={20} />,
      label: "Full Tests",
      value: totalTests,
      description: "Total sessions",
      iconClass: "bg-primary/10 text-primary",
    },
    {
      icon: <Check width={20} />,
      label: "Completed",
      value: completedTests,
      description: "Finished sessions",
      iconClass: "bg-success/10 text-success",
    },
    {
      icon: <ChartColumnStacked width={20} />,
      label: "Accuracy",
      value: `${averageAccuracy}%`,
      description: "Across all questions",
      iconClass: "bg-warning/10 text-warning",
    },
    {
      icon: <Cup width={20} />,
      label: "Avg. Score",
      value:
        averageScaledScore !== null ? averageScaledScore : "N/A",
      description: "Scaled score (400–1600)",
      iconClass: "bg-secondary/10 text-secondary",
    },
  ];

  return (
    <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cardContent.map((item, index) => (
        <SummaryCard
          key={index}
          icon={item.icon}
          label={item.label}
          value={item.value}
          description={item.description}
          iconClass={item.iconClass}
        />
      ))}
    </section>
  );
}