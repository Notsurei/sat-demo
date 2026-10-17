"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import axios from "axios";

import { Button, Card, Chip, Spinner } from "@heroui/react";
import { ArrowLeft, Check, Shield, CircleInfo } from "@gravity-ui/icons";

import { useRouter } from "@/i18n/navigation";
import { useAuthStore } from "@/zustand/auth-store";

const PLAN_META = {
  BASIC: { price: "$9.99", amount: 9.99 },
  PREMIUM: { price: "$19.99", amount: 19.99 },
  VIP: { price: "$29.99", amount: 29.99 },
} as const;

type PlanKey = keyof typeof PLAN_META;

const isPlanKey = (value: string): value is PlanKey =>
  value in PLAN_META;

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("checkout");

  const { user, isAuthenticated } = useAuthStore();

  const planParam = searchParams.get("plan")?.toUpperCase() ?? "";
  const plan: PlanKey = isPlanKey(planParam) ? planParam : "BASIC";

  const planMeta = PLAN_META[plan];
  const planName = t(`plans.${plan}.name`);
  const planFeatures = t.raw(`plans.${plan}.features`) as string[];

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleCheckout = async () => {
    if (!user) {
      setError(t("errors.notLoggedIn"));
      return;
    }

    try {
      setLoading(true);
      setError("");

      const { data } = await axios.post("/api/payments/checkout", {
        userId: user.id,
        email: user.email,
        plan,
      });

      window.location.href = data.url;
    } catch (err: any) {
      setError(err?.response?.data?.error || t("errors.checkoutFailed"));
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-default-100 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <Button variant="primary" onPress={() => router.back()}>
          <ArrowLeft />
          {t("back")}
        </Button>

        <div className="mt-8">
          <Chip color="default">{t("stripeBadge")}</Chip>

          <h1 className="mt-4 text-4xl font-bold">{t("title")}</h1>

          <p className="mt-2 text-default-500">{t("subtitle")}</p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          <Card>
            <Card.Header>
              <div>
                <Chip color="success">{planName}</Chip>

                <h2 className="mt-5 text-4xl font-bold">
                  {planMeta.price}

                  <span className="ml-2 text-base font-normal text-default-500">
                    {t("planCard.priceSuffix")}
                  </span>
                </h2>
              </div>
            </Card.Header>

            <Card.Footer>
              <div>
                <h3 className="font-semibold">
                  {t("planCard.includedTitle")}
                </h3>

                <div className="mt-6 space-y-4">
                  {planFeatures.map((feature) => (
                    <div key={feature} className="flex items-center gap-3">
                      <div className="rounded-full bg-success/10 p-2">
                        <Check width={14} className="text-success" />
                      </div>

                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card.Footer>

            <Card.Footer className="flex justify-between">
              <span className="font-semibold">
                {t("planCard.totalLabel")}
              </span>

              <span className="text-2xl font-bold">{planMeta.price}</span>
            </Card.Footer>
          </Card>

          <Card>
            <Card.Header>
              <div>
                <h2 className="text-2xl font-bold">{t("billing.title")}</h2>

                <p className="text-default-500">{t("billing.subtitle")}</p>
              </div>
            </Card.Header>

            <Card.Content className="space-y-6">
              <div>
                <p className="text-xs uppercase text-default-400">
                  {t("billing.accountLabel")}
                </p>

                <p className="mt-1 font-semibold">
                  {user?.firstName} {user?.lastName}
                </p>

                <p className="text-default-500">{user?.email}</p>
              </div>

              <div className="rounded-xl bg-success-50 p-5">
                <div className="flex items-start gap-3">
                  <Shield className="mt-1 shrink-0 text-success" />

                  <div>
                    <p className="font-semibold">
                      {t("billing.securePayment.title")}
                    </p>

                    <p className="text-sm leading-relaxed text-default-500">
                      {t("billing.securePayment.description")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-primary-50 p-5">
                <div className="flex items-start gap-3">
                  <CircleInfo className="mt-1 shrink-0 text-primary" />

                  <div>
                    <p className="font-semibold">
                      {t("billing.whatHappensNext.title")}
                    </p>

                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-default-500">
                      <li>{t("billing.whatHappensNext.items.redirect")}</li>
                      <li>{t("billing.whatHappensNext.items.enterPayment")}</li>
                      <li>
                        {t("billing.whatHappensNext.items.startImmediately")}
                      </li>
                      <li>
                        {t("billing.whatHappensNext.items.cancelAnytime")}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {error && <p className="text-sm text-danger">{error}</p>}
            </Card.Content>

            <Card.Footer>
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                isDisabled={!isAuthenticated || loading}
                onPress={handleCheckout}
              >
                {loading ? (
                  <Spinner size="sm" color="current" />
                ) : (
                  t("continueButton", { price: planMeta.price })
                )}
              </Button>
            </Card.Footer>
          </Card>
        </div>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  const t = useTranslations("checkout");

  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen flex-col items-center justify-center gap-4">
          <Spinner size="lg" />
          <p className="text-sm text-default-500">{t("loadingFallback")}</p>
        </main>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}