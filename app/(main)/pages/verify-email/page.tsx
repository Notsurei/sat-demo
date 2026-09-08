"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, Button } from "@heroui/react";
import { Check, Clock, CircleInfo, XmarkShape } from "@gravity-ui/icons";

function VerifyContent() {
  const params = useSearchParams();
  const status = params.get("status");

  const content = {
    success: {
      icon: <Check />,
      title: "Email Verified!",
      description:
        "Your email has been successfully verified. You can now sign in to your account.",
      color: "success",
      buttonText: "Sign In",
    },
    already: {
      icon: <CircleInfo />,
      title: "Already Verified",
      description:
        "Your email has already been verified. You can sign in normally.",
      color: "primary",
      buttonText: "Sign In",
    },
    expired: {
      icon: <Clock />,
      title: "Verification Link Expired",
      description:
        "Your verification link has expired. Please request a new verification email.",
      color: "warning",
      buttonText: "Request New Link",
    },
    invalid: {
      icon: <XmarkShape />,
      title: "Invalid Verification Link",
      description: "The verification link is invalid or has already been used.",
      color: "danger",
      buttonText: "Sign In",
    },
  } as const;

  const page = content[(status as keyof typeof content) || "invalid"];

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-black via-[#0f172a] to-black">
      <Card className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
        <Card.Header className="p-8 text-center">
          <div className="text-6xl mb-4">{page.icon}</div>

          <h1 className="text-2xl md:text-3xl font-bold text-white">
            {page.title}
          </h1>

          <p className="text-gray-400 mt-3 text-sm md:text-base">
            {page.description}
          </p>

          <div className="mt-6 flex flex-col gap-3">
            {page.color === "warning" && (
              <Link href="/">
                <Button
                  variant="primary"
                  className="text-gray-400 hover:text-white"
                >
                  Go Home
                </Button>
              </Link>
            )}
          </div>

          <p className="text-xs text-gray-500">
            Need help?{" "}
            <Link href="/contact" className="text-blue-400 hover:text-blue-300">
              Contact Support
            </Link>
          </p>
        </Card.Header>
      </Card>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-[#0f172a] to-black">
          <div className="text-white">Loading...</div>
        </main>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
