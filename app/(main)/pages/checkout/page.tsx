"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/zustand/auth-store";
import axios from "axios";
import { Button, Card, Chip, Spinner } from "@heroui/react";
import { ArrowLeft, Check, Shield, CircleInfo } from "@gravity-ui/icons";

const plans = {
  BASIC: {
    name: "Basic",
    price: "$9.99",
    amount: 9.99,
    features: [
      "1 Full SAT Test / month",
      "Unlimited Practice Questions",
      "Detailed Explanations",
    ],
  },

  PREMIUM: {
    name: "Premium",
    price: "$19.99",
    amount: 19.99,
    features: [
      "4 Full SAT Tests / month",
      "Unlimited Practice",
      "AI Analytics",
      "Performance Tracking",
    ],
  },

  VIP: {
    name: "VIP",
    price: "$29.99",
    amount: 29.99,
    features: [
      "Unlimited SAT Tests",
      "Unlimited Practice",
      "AI Insights",
      "Priority Support",
      "Custom Practice",
    ],
  },
};

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { user, isAuthenticated } = useAuthStore();

  const plan =
    (searchParams.get("plan")?.toUpperCase() as keyof typeof plans) || "BASIC";

  const selected = plans[plan];

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleCheckout = async () => {
    if (!user) return;

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
      setError(err?.response?.data?.error || "Unable to start checkout.");
      setLoading(false);
    }
  };

  if (!selected) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        Invalid plan.
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-default-100 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <Button variant="primary" onPress={() => router.back()}>
          <ArrowLeft /> Back
        </Button>

        <div className="mt-8">
          <Chip color="default">Stripe Checkout</Chip>

          <h1 className="mt-4 text-4xl font-bold">Review your subscription</h1>

          <p className="mt-2 text-default-500">
            You'll be redirected to Stripe to securely complete your payment.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          <Card>
            <Card.Header>
              <div>
                <Chip color="success">{selected.name}</Chip>

                <h2 className="mt-5 text-4xl font-bold">
                  {selected.price}

                  <span className="ml-2 text-base font-normal text-default-500">
                    / month
                  </span>
                </h2>
              </div>
            </Card.Header>

            <Card.Footer>
              <h3 className="font-semibold">Included in your subscription</h3>

              <div className="mt-6 space-y-4">
                {selected.features.map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="rounded-full bg-success/10 p-2">
                      <Check width={14} className="text-success" />
                    </div>

                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </Card.Footer>

            <Card.Footer className="flex justify-between">
              <span className="font-semibold">Total</span>

              <span className="text-2xl font-bold">{selected.price}</span>
            </Card.Footer>
          </Card>

          <Card>
            <Card.Header>
              <div>
                <h2 className="text-2xl font-bold">Billing</h2>

                <p className="text-default-500">
                  Review your account before continuing.
                </p>
              </div>
            </Card.Header>

            <Card.Content className="space-y-6">
              <div>
                <p className="text-xs uppercase text-default-400">Account</p>

                <p className="mt-1 font-semibold">
                  {user?.firstName} {user?.lastName}
                </p>

                <p className="text-default-500">{user?.email}</p>
              </div>

              <div className="rounded-xl bg-success-50 p-5">
                <div className="flex items-start gap-3">
                  <Shield className="mt-1 text-success" />

                  <div>
                    <p className="font-semibold">Secure Payment</p>

                    <p className="text-sm text-default-500">
                      Your payment information is securely handled by Stripe. We
                      never store your credit or debit card details.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-primary-50 p-5">
                <div className="flex items-start gap-3">
                  <CircleInfo className="mt-1 text-primary" />

                  <div>
                    <p className="font-semibold">What happens next?</p>

                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-default-500">
                      <li>You will be redirected to Stripe.</li>
                      <li>Enter your payment details.</li>
                      <li>
                        Your subscription starts immediately after payment.
                      </li>
                      <li>You can cancel anytime from your account.</li>
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
                // isLoading={loading}
                isDisabled={!isAuthenticated}
                onPress={handleCheckout}
              >
                {loading ? (
                  <Spinner size="sm" color="current" />
                ) : (
                  `Continue to Stripe • ${selected.price}`
                )}
              </Button>
            </Card.Footer>
          </Card>
        </div>
      </div>
    </main>
  );
}
