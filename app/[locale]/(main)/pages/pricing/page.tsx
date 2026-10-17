"use client";

import React from "react";
import { Check } from "@gravity-ui/icons";
import { Button, Card, Chip } from "@heroui/react";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import { useAuthStore } from "@/zustand/auth-store";
import AuthModal from "@/app/components/modal-button/auth-modal";

const TIERS = [
  {
    key: "FREE",
    price: "$0.00",
    mostPopular: false,
    topBar: "bg-default-300",
    theme: {
      card: "border-default-200 bg-content1",
      icon: "bg-default-100 text-default-600",
      price: "text-foreground",
      button: "outline" as const,
      glow: "",
    },
  },
  {
    key: "BASIC",
    price: "$9.99",
    mostPopular: true,
    topBar: "bg-primary",
    theme: {
      card: "border-primary/40 bg-primary/[0.04]",
      icon: "bg-primary/10 text-primary",
      price: "text-primary",
      button: "primary" as const,
      glow: "shadow-primary/20 shadow-xl",
    },
  },
  {
    key: "PREMIUM",
    price: "$19.99",
    mostPopular: false,
    topBar: "bg-secondary",
    theme: {
      card: "border-secondary/40 bg-secondary/[0.04]",
      icon: "bg-secondary/10 text-secondary",
      price: "text-secondary",
      button: "secondary" as const,
      glow: "shadow-secondary/10 shadow-lg",
    },
  },
  {
    key: "VIP",
    price: "$29.99",
    mostPopular: false,
    topBar: "bg-warning",
    theme: {
      card: "border-warning/40 bg-warning/[0.05]",
      icon: "bg-warning/15 text-warning",
      price: "text-warning",
      button: "warning" as const,
      glow: "shadow-warning/10 shadow-lg",
    },
  },
] as const;

type TierKey = (typeof TIERS)[number]["key"];

export default function Pricing() {
  const router = useRouter();
  const t = useTranslations("pricing");

  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);
  const { isAuthenticated } = useAuthStore();

  const handleSelectedPlan = (planKey: TierKey) => {
    if (planKey === "FREE") {
      router.push("/pages/home");
      return;
    }

    router.push(`/pages/checkout?plan=${planKey}`);
  };

  return (
    <main className="relative min-h-screen overflow-hidden py-20">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute left-0 top-[500px] h-[300px] w-[300px] rounded-full bg-secondary/10 blur-3xl" />
        <div className="absolute right-0 top-[700px] h-[300px] w-[300px] rounded-full bg-warning/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <Chip
            color="accent"
            variant="soft"
            className="border border-primary/20"
          >
            {t("badge")}
          </Chip>

          <h1 className="mt-6 text-5xl font-black leading-tight tracking-tight md:text-6xl">
            {t.rich("title", {
              highlight: (chunks) => (
                <span className="relative inline-block text-primary">
                  {chunks}
                  <span className="absolute -bottom-1 left-0 h-1 w-full rounded-full bg-primary/30" />
                </span>
              ),
            })}
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-default-500">
            {t.rich("subtitle", {
              score: (chunks) => (
                <span className="font-semibold text-foreground">
                  {chunks}
                </span>
              ),
            })}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Chip
              size="sm"
              variant="secondary"
              className="border border-success/40 bg-success/10 font-semibold text-success"
            >
              ✓ {t("featureChips.practiceQuestions")}
            </Chip>

            <Chip
              size="sm"
              variant="primary"
              className="border border-primary/40 bg-primary/10 font-semibold text-primary"
            >
              ✓ {t("featureChips.detailedAnalytics")}
            </Chip>

            <Chip
              size="sm"
              variant="secondary"
              className="border border-secondary/40 bg-secondary/10 font-semibold text-secondary"
            >
              ✓ {t("featureChips.satFocused")}
            </Chip>
          </div>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {TIERS.map((tier) => {
            const tierName = t(`tiers.${tier.key}.name`);
            const tierFeatures = t.raw(
              `tiers.${tier.key}.features`,
            ) as string[];

            const buttonLabel =
              tier.key === "FREE"
                ? t("buttons.getStarted")
                : t("buttons.choosePlan");

            return (
              <Card
                key={tier.key}
                className={`
                  group relative overflow-hidden
                  border
                  transition-all duration-300
                  hover:-translate-y-2
                  hover:shadow-2xl
                  ${tier.theme.card}
                  ${tier.theme.glow}
                `}
              >
                <div
                  className={`absolute left-0 right-0 top-0 h-1 ${tier.topBar}`}
                />

                {tier.mostPopular && (
                  <div className="absolute right-4 top-5">
                    <Chip
                      size="sm"
                      className="bg-primary font-semibold text-primary-foreground shadow-lg shadow-primary/30"
                    >
                      {t("mostPopular")}
                    </Chip>
                  </div>
                )}

                <Card.Header className="p-8 pb-5">
                  <h2 className="mt-6 text-2xl font-bold">{tierName}</h2>

                  <p className="mt-3 min-h-[72px] text-sm leading-6 text-default-500">
                    {t(`tiers.${tier.key}.description`)}
                  </p>

                  <div className="mt-8 flex items-baseline">
                    <span className={`text-4xl font-black ${tier.theme.price}`}>
                      {tier.price}
                    </span>

                    <span className="ml-2 text-sm text-default-500">
                      {t("periodSuffix")}
                    </span>
                  </div>

                  <div className="my-8 h-px bg-default-200" />

                  <ul className="space-y-4">
                    {tierFeatures.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <div
                          className={`
                            mt-0.5 flex h-6 w-6 shrink-0
                            items-center justify-center
                            rounded-full
                            ${tier.theme.icon}
                          `}
                        >
                          <Check width={14} />
                        </div>

                        <span className="text-sm leading-6">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </Card.Header>

                <Card.Footer className="mt-auto p-8 pt-4">
                  {isAuthenticated ? (
                    <Button
                      fullWidth
                      size="lg"
                      // variant={tier.theme.button}
                      onPress={() => handleSelectedPlan(tier.key)}
                      className={
                        tier.mostPopular
                          ? "font-bold shadow-lg shadow-primary/25"
                          : ""
                      }
                    >
                      {buttonLabel}
                    </Button>
                  ) : (
                    <>
                      <Button
                        fullWidth
                        size="lg"
                        // variant={tier.theme.button}
                        onPress={() => setIsAuthModalOpen(true)}
                      >
                        {buttonLabel}
                      </Button>

                      <AuthModal />
                    </>
                  )}
                </Card.Footer>
              </Card>
            );
          })}
        </div>

        <div className="relative mt-20 overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-content1 to-secondary/10 p-10 text-center shadow-xl md:p-14">
          <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-96 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative">
            <Chip variant="primary">{t("cta.badge")}</Chip>

            <h2 className="mt-5 text-3xl font-black leading-tight md:text-4xl">
              {t("cta.title")}
            </h2>

            <p className="mx-auto mt-4 max-w-2xl leading-7 text-default-500">
              {t("cta.description")}
            </p>

            <div className="mt-8 flex justify-center gap-3">
              <Button
                size="lg"
                variant="primary"
                onPress={() =>
                  isAuthenticated
                    ? router.push("/pages/home")
                    : setIsAuthModalOpen(true)
                }
              >
                {t("cta.startFree")}
              </Button>

              <Button
                size="lg"
                variant="outline"
                onPress={() => router.push("/pages/home")}
              >
                {t("cta.explorePractice")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}