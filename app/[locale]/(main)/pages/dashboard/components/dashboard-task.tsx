"use client";

import { Card } from "@heroui/react";
import { useTranslations } from "next-intl";

import ToDoList from "@/app/components/to-do-list/to-do-list";

export default function DashboardTasks() {
  const t = useTranslations("dashboard.tasks");

  return (
    <Card className="h-full border border-default-200 bg-background shadow-sm">
      <Card.Header className="border-b border-default-200 px-6 py-5">
        <div>
          <h2 className="text-lg font-semibold leading-tight">
            {t("title")}
          </h2>

          <p className="mt-1 text-sm leading-relaxed text-default-500">
            {t("subtitle")}
          </p>
        </div>
      </Card.Header>

      <Card.Content className="p-5">
        <ToDoList />
      </Card.Content>
    </Card>
  );
}