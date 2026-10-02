"use client";

import { Card } from "@heroui/react";

import ToDoList from "@/app/components/to-do-list/to-do-list";

export default function DashboardTasks() {
  return (
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
  );
}

