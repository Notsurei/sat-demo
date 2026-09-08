"use client";

import React from "react";
import { Card } from "@heroui/react";

interface SummaryCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  description: string;
  iconClass?: string;
}

export default function SummaryCard({
  icon,
  label,
  value,
  description,
  iconClass = "bg-primary/10 text-primary",
}: SummaryCardProps) {
  return (
    <Card className="border border-slate-200 bg-white shadow-sm">
      <Card.Content className="p-5">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>

        <div className="mt-5">
          <p className="text-sm font-medium leading-5 text-slate-500">
            {label}
          </p>

          <p className="mt-1 text-3xl font-bold leading-none tracking-tight text-slate-900">
            {value}
          </p>

          <p className="mt-2 text-xs font-medium text-slate-400">
            {description}
          </p>
        </div>
      </Card.Content>
    </Card>
  );
}