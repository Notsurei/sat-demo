"use client";

import React from "react";
import { Check } from "@gravity-ui/icons";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/zustand/auth-store";
import { Button, Card, Chip } from "@heroui/react";
import AuthModal from "@/app/components/modal-button/auth-modal";

const tiers = [
  {
    name: "Free",
    id: "Free",
    href: "checkout",
    price: "$0.00",
    period: "/month",
    amount: 0,
    description:
      "Start practicing and build your SAT foundation completely free.",
    features: ["Limited Practice", "Mini Mock Test", "Only Score Report"],
    mostPopular: false,
    theme: {
      card: "border-default-200 bg-content1",
      icon: "bg-default-100 text-default-600",
      price: "text-foreground",
      button: "outline",
      glow: "",
      badge: "",
    },
  },
  {
    name: "Basic",
    id: "Basic",
    href: "checkout",
    price: "$9.99",
    period: "/month",
    amount: 20,
    description: "Everything you need to start serious SAT preparation.",
    features: [
      "1 full test/month",
      "Access to full practice questions",
      "Explanations for all questions",
    ],
    mostPopular: true,
    theme: {
      card: "border-primary/40 bg-primary/[0.04]",
      icon: "bg-primary/10 text-primary",
      price: "text-primary",
      button: "primary",
      glow: "shadow-primary/20 shadow-xl",
      badge: "bg-primary text-primary-foreground",
    },
  },
  {
    name: "Premium",
    id: "Premium",
    href: "checkout",
    price: "$19.99",
    period: "/month",
    amount: 50,
    description: "Advanced analytics and more tests for ambitious students.",
    features: [
      "4 full tests/month",
      "Advanced analytics",
      "Access to full practice questions",
      "Explanations for all questions",
    ],
    mostPopular: false,
    theme: {
      card: "border-secondary/40 bg-secondary/[0.04]",
      icon: "bg-secondary/10 text-secondary",
      price: "text-secondary",
      button: "secondary",
      glow: "shadow-secondary/10 shadow-lg",
      badge: "",
    },
  },
  {
    name: "VIP",
    id: "VIP",
    href: "checkout",
    price: "$29.99",
    period: "/month",
    amount: 50,
    description:
      "The complete SAT experience with unlimited practice and insights.",
    features: [
      "Unlimited tests/month",
      "Access to full practice questions",
      "Advanced analytics",
      "Customized test creation",
      "Marking and grading",
      "Customized feedback",
    ],
    mostPopular: false,
    theme: {
      card: "border-warning/40 bg-warning/[0.05]",
      icon: "bg-warning/15 text-warning",
      price: "text-warning",
      button: "warning",
      glow: "shadow-warning/10 shadow-lg",
      badge: "",
    },
  },
];

export default function Pricing() {
  const router = useRouter();
  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);
  const { isAuthenticated } = useAuthStore();

  const handleSelectedPlan = (plan: string) => {
    const tier = tiers.find((t) => t.id === plan);

    if (!tier) return;

    if (tier.id === "Free") {
      router.push("/pages/pricing");
      return;
    }

    router.push(`/pages/checkout?plan=${tier.id}`);
  };

  return (
    <main className="relative min-h-screen overflow-hidden py-20">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

        <div className="absolute left-0 top-[500px] h-[300px] w-[300px] rounded-full bg-secondary/10 blur-3xl" />

        <div className="absolute right-0 top-[700px] h-[300px] w-[300px] rounded-full bg-warning/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <Chip
            color="accent"
            variant="soft"
            className="border border-primary/20"
          >
            SAT Preparation
          </Chip>

          <h1 className="mt-6 text-5xl font-black tracking-tight md:text-6xl">
            Choose your{" "}
            <span className="relative inline-block text-primary">
              SAT plan
              <span className="absolute -bottom-1 left-0 h-1 w-full rounded-full bg-primary/30" />
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-default-500">
            Whether you're just starting or aiming for a{" "}
            <span className="font-semibold text-foreground">1500+</span>, choose
            the plan that fits your preparation journey.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Chip
              size="sm"
              variant="secondary"
              className="border border-success/40 bg-success/10 font-semibold text-success"
            >
              ✓ Practice Questions
            </Chip>

            <Chip
              size="sm"
              variant="primary"
              className="border border-primary/40 bg-primary/10 font-semibold text-primary"
            >
              ✓ Detailed Analytics
            </Chip>

            <Chip
              size="sm"
              variant="secondary"
              className="border border-secondary/40 bg-secondary/10 font-semibold text-secondary"
            >
              ✓ SAT Focused
            </Chip>
          </div>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {tiers.map((tier) => (
            <Card
              key={tier.id}
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
                className={`
                  absolute left-0 right-0 top-0 h-1
                  ${tier.id === "Free"
                    ? "bg-default-300"
                    : tier.id === "Basic"
                      ? "bg-primary"
                      : tier.id === "Premium"
                        ? "bg-secondary"
                        : "bg-warning"
                  }
                `}
              />

              {/* Popular badge */}
              {tier.mostPopular && (
                <div className="absolute right-4 top-5">
                  <Chip
                    size="sm"
                    className="bg-primary font-semibold text-primary-foreground shadow-lg shadow-primary/30"
                  >
                    Most Popular
                  </Chip>
                </div>
              )}

              <Card.Header className="p-8 pb-5">
                <h2 className="mt-6 text-2xl font-bold">{tier.name}</h2>

                <p className="mt-3 min-h-[72px] text-sm leading-6 text-default-500">
                  {tier.description}
                </p>

                <div className="mt-8 flex items-baseline">
                  <span className={`text-4xl font-black ${tier.theme.price}`}>
                    {tier.price}
                  </span>

                  <span className="ml-2 text-sm text-default-500">
                    {tier.period}
                  </span>
                </div>

                <div className="my-8 h-px bg-default-200" />

                <ul className="space-y-4">
                  {tier.features.map((feature) => (
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
                    variant={
                      tier.mostPopular
                        ? "primary"
                        : tier.id === "Premium"
                          ? "secondary"
                          : "outline"
                    }
                    onPress={() => handleSelectedPlan(tier.id)}
                    className={
                      tier.mostPopular
                        ? "font-bold shadow-lg shadow-primary/25"
                        : ""
                    }
                  >
                    {tier.name === "Free" ? "Get Started" : "Choose Plan"}
                  </Button>
                ) : (
                  <>
                    <Button
                      fullWidth
                      size="lg"
                      variant={
                        tier.mostPopular
                          ? "primary"
                          : tier.id === "Premium"
                            ? "secondary"
                            : "outline"
                      }
                      onPress={() => setIsAuthModalOpen(true)}
                    >
                      {tier.name === "Free" ? "Get Started" : "Choose Plan"}
                    </Button>

                    <AuthModal />
                  </>
                )}
              </Card.Footer>
            </Card>
          ))}
        </div>

        <div className="relative mt-20 overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-content1 to-secondary/10 p-10 text-center shadow-xl md:p-14">
          <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-96 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative">
            <Chip variant="primary">Start your preparation today</Chip>

            <h2 className="mt-5 text-3xl font-black md:text-4xl">
              Not sure which plan is right for you?
            </h2>

            <p className="mx-auto mt-4 max-w-2xl leading-7 text-default-500">
              Start with Free and upgrade whenever you need more practice,
              detailed analytics, and full-length SAT tests.
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
                Start Learning Free
              </Button>

              <Button
                size="lg"
                variant="outline"
                onPress={() => router.push("/pages/home")}
              >
                Explore Practice
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
