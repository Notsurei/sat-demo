"use client";

import { Button, Chip } from "@heroui/react";

import KnowledgeModal from "@/app/components/modal-button/knowledge-modal";
import TestModeModal from "@/app/components/modal-button/test-mode-modal";

interface DashboardHeaderProps {
  firstName?: string | null;
  subscriptionPlan?: string | null;
  isKnowledgeModalOpen: boolean;
  onKnowledgeModalChange: (open: boolean) => void;
}

export default function DashboardHeader({
  firstName,
  subscriptionPlan,
  isKnowledgeModalOpen,
  onKnowledgeModalChange,
}: DashboardHeaderProps) {
  return (
    <section className="mb-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Chip size="sm" variant="primary">
              SAT Dashboard
            </Chip>

            <Chip size="sm" variant="primary" color="accent">
              {subscriptionPlan || "FREE"}
            </Chip>
          </div>

          <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">
            Hello, {firstName || "there"} 👋
          </h1>

          <p className="mt-2 max-w-2xl text-default-500">
            Keep practicing and review your recent performance to improve your
            SAT score.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <TestModeModal />

          <Button
            variant="outline"
            onPress={() => onKnowledgeModalChange(true)}
          >
            📋 Knowledge Review
          </Button>

          <KnowledgeModal
            isOpen={isKnowledgeModalOpen}
            onOpenChange={onKnowledgeModalChange}
          />
        </div>
      </div>
    </section>
  );
}

