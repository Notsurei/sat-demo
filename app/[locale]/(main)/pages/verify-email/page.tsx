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
    iconBgClass: string;
  }
> = {
  success: {
    icon: <Check width={48} height={48} />,
    iconClass: "text-emerald-600",
    iconBgClass: "bg-emerald-50 ring-emerald-100",
  },
  already: {
    icon: <CircleInfo width={48} height={48} />,
    iconClass: "text-blue-600",
    iconBgClass: "bg-blue-50 ring-blue-100",
  },
  expired: {
    icon: <Clock width={48} height={48} />,
    iconClass: "text-amber-600",
    iconBgClass: "bg-amber-50 ring-amber-100",
  },
  invalid: {
    icon: <XmarkShape width={48} height={48} />,
    iconClass: "text-red-600",
    iconBgClass: "bg-red-50 ring-red-100",
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
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 px-6">
      <Card className="w-full max-w-md border border-slate-200 bg-white shadow-xl">
        <Card.Header className="p-8 text-center">
          <div className="mb-5 flex justify-center">
            <div
              className={`flex h-20 w-20 items-center justify-center rounded-full ring-8 ${config.iconBgClass} ${config.iconClass}`}
            >
              {config.icon}
            </div>
          </div>

          <h1 className="text-2xl font-bold leading-tight text-slate-900 md:text-3xl">
            {t(`${status}.title`)}
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-base">
            {t(`${status}.description`)}
          </p>

          <div className="mt-8 flex flex-col gap-3">
            {status === "success" && (
              <Link href="/">
                <Button
                  variant="primary"
                  className="w-full font-semibold text-white"
                >
                  {t("buttons.signIn")}
                </Button>
              </Link>
            )}

            {status === "already" && (
              <Link href="/">
                <Button
                  variant="primary"
                  className="w-full font-semibold text-white"
                >
                  {t("buttons.signIn")}
                </Button>
              </Link>
            )}

            {status === "expired" && (
              <>
                <Link href="/pages/signin">
                  <Button
                    variant="primary"
                    className="w-full font-semibold text-white"
                  >
                    {t("buttons.requestNewLink")}
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" className="w-full font-medium">
                    {t("buttons.goHome")}
                  </Button>
                </Link>
              </>
            )}

            {status === "invalid" && (
              <>
                <Link href="/pages/signin">
                  <Button
                    variant="primary"
                    className="w-full font-semibold text-white"
                  >
                    {t("buttons.goHome")}
                  </Button>
                </Link>
              </>
            )}
          </div>

          <p className="mt-8 text-xs text-slate-500">
            {t("support.text")}{" "}
            <Link
              href="/contact"
              className="font-medium text-blue-600 transition-colors hover:text-blue-700"
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
        <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100">
          <div className="text-slate-600">{t("loading")}</div>
        </main>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}