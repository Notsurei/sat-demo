"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, Button } from "@heroui/react";
import { useTranslations } from "next-intl";
import { Check, Clock, CircleInfo, XmarkShape } from "@gravity-ui/icons";

import { Link } from "@/i18n/navigation";

type VerifyStatus = "success" | "already" | "expired" | "invalid";

const VALID_STATUSES: VerifyStatus[] = [
  "success",
  "already",
  "expired",
  "invalid",
];

const STATUS_CONFIG: Record<
  VerifyStatus,
  {
    icon: React.ReactNode;
    iconClass: string;
  }
> = {
  success: {
    icon: <Check width={56} height={56} />,
    iconClass: "text-success",
  },
  already: {
    icon: <CircleInfo width={56} height={56} />,
    iconClass: "text-primary",
  },
  expired: {
    icon: <Clock width={56} height={56} />,
    iconClass: "text-warning",
  },
  invalid: {
    icon: <XmarkShape width={56} height={56} />,
    iconClass: "text-danger",
  },
};

function VerifyContent() {
  const params = useSearchParams();
  const t = useTranslations("auth.verifyEmail");

  const statusParam = params.get("status") ?? "";
  const status: VerifyStatus = VALID_STATUSES.includes(
    statusParam as VerifyStatus,
  )
    ? (statusParam as VerifyStatus)
    : "invalid";

  const config = STATUS_CONFIG[status];

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-black via-[#0f172a] to-black px-6">
      <Card className="w-full max-w-md border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl">
        <Card.Header className="p-8 text-center">
          <div className={`mb-4 flex justify-center ${config.iconClass}`}>
            {config.icon}
          </div>

          <h1 className="text-2xl font-bold leading-tight text-white md:text-3xl">
            {t(`${status}.title`)}
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-gray-400 md:text-base">
            {t(`${status}.description`)}
          </p>

          {status === "expired" && (
            <div className="mt-6 flex flex-col gap-3">
              <Link href="/">
                <Button
                  variant="primary"
                  className="w-full text-gray-300 transition-colors hover:text-white"
                >
                  {t("buttons.goHome")}
                </Button>
              </Link>
            </div>
          )}

          <p className="mt-6 text-xs text-gray-500">
            {t("support.text")}{" "}
            <Link
              href="/contact"
              className="text-blue-400 transition-colors hover:text-blue-300"
            >
              {t("support.link")}
            </Link>
          </p>
        </Card.Header>
      </Card>
    </main>
  );
}

export default function VerifyEmailPage() {
  const t = useTranslations("auth.verifyEmail");

  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-black via-[#0f172a] to-black">
          <div className="text-white">{t("loading")}</div>
        </main>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}