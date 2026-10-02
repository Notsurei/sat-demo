"use client";

import { useRouter } from "next/navigation";
import { Button, Card } from "@heroui/react";
import { CircleCheck } from "@gravity-ui/icons";

interface DashboardUpgradeBannerProps {
  subscriptionPlan?: string | null;
}

export default function DashboardUpgradeBanner({
  subscriptionPlan,
}: DashboardUpgradeBannerProps) {
  const router = useRouter();

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
              <p className="font-semibold text-primary-900">
                You&apos;re using the Free plan
              </p>

              <p className="mt-1 text-sm text-primary-700">
                Your dashboard keeps your 5 most recent practice sessions.
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="primary"
            onPress={() => router.push("/pages/pricing")}
          >
            Upgrade Plan
          </Button>
        </Card.Content>
      </Card>
    </section>
  );
}

