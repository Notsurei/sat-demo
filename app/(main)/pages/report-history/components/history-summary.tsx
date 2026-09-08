"use client";

import React from "react";
import {
  TargetDart,
  Check,
  ChartColumnStacked,
} from "@gravity-ui/icons";

import SummaryCard from "./summary-card";

interface HistorySummaryProps {
  totalPractices: number;
  completedPractices: number;
  averageAccuracy: number;
  averageScore: number | null;
}

export default function HistorySummary({
  totalPractices,
  completedPractices,
  averageAccuracy,
  averageScore,
}: HistorySummaryProps) {

  const cardContent = [
    { 
      icon: <TargetDart width={20} />, 
      label: "Practices", 
      value: totalPractices, 
      description: "Total sessions", 
      iconClass: "bg-primary/10 text-summary" 
    },
    { 
      icon: <Check width={20} />, 
      label: "Completed", 
      value: completedPractices, 
      description: "Finished sessions", 
      iconClass: "bg-success/10 text-success" 
    },
    { 
      icon: <ChartColumnStacked width={20} />, 
      label: "Accuracy", 
      value: averageAccuracy, 
      description: "Across all questions", 
      iconClass: "bg-warning/10 text-warninig" 
    },
    { 
      icon: <TargetDart width={20} />, 
      label: "Avg. Score", 
      value: averageScore !== null ? `${averageScore}%` : 'N/A', 
      description: "Complete sessions", 
      iconClass: "bg-secondary/10 text-secondary" 
    }
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