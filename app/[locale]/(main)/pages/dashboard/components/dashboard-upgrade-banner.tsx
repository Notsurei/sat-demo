"use client";

import { Button, Card } from "@heroui/react";
import { useTranslations } from "next-intl";
import { CircleCheck } from "@gravity-ui/icons";

import { useRouter } from "@/i18n/navigation";

interface DashboardUpgradeBannerProps {
  subscriptionPlan?: string | null;
}

export default function DashboardUpgradeBanner({
  subscriptionPlan,
}: DashboardUpgradeBannerProps) {
  const router = useRouter();
  const t = useTranslations("dashboard.upgradeBanner");

  if (subscriptionPlan !== "FREE") {
    return null;
  }

  return (
    <section className="mt-6">
      <Card className="border border-primary-200 bg-primary-50 shadow-sm">
        <Card.Content className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-primary">
              <CircleCheck width={20} />
            </div>

            <div>
              <p className="font-semibold leading-tight text-primary-900">
                {t("title")}
              </p>

              <p className="mt-1 text-sm leading-relaxed text-primary-700">
                {t("description")}
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="primary"
            onPress={() => router.push("/pages/pricing")}
          >
            {t("upgradeButton")}
          </Button>
        </Card.Content>
      </Card>
    </section>
  );
}