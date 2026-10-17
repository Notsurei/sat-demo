"use client";

import { Button, Chip } from "@heroui/react";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("dashboard.header");
  const tNav = useTranslations("nav");

  const greeting = firstName
    ? t("greeting", { name: firstName })
    : t("greetingFallback");

  const planLabel =
    !subscriptionPlan || subscriptionPlan === "FREE"
      ? tNav("freePlan")
      : subscriptionPlan;

  return (
    <section className="mb-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Chip size="sm" variant="primary">
              {t("badge")}
            </Chip>

            <Chip size="sm" variant="primary" color="accent">
              {planLabel}
            </Chip>
          </div>

          <h1 className="text-3xl font-bold leading-tight tracking-tight lg:text-4xl">
            {greeting}
          </h1>

          <p className="mt-2 max-w-2xl text-base leading-relaxed text-default-500">
            {t("description")}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <TestModeModal />

          <Button
            variant="outline"
            onPress={() => onKnowledgeModalChange(true)}
          >
            📋 {t("knowledgeReview")}
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