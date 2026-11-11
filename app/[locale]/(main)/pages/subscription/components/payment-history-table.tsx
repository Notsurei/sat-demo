"use client";

import { useEffect, useState } from "react";
import { Button, Card, Chip, Spinner } from "@heroui/react";
import { useTranslations } from "next-intl";
import axios from "axios";

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  plan: string;
  paidAt: string | null;
  createdAt: string;
  cardBrand: string | null;
  cardLast4: string | null;
  receiptUrl: string | null;
}

/* Format amount theo currency */
function formatAmount(amount: number, currency: string): string {
  const cur = currency.toUpperCase();

  // USD/EUR: amount là cents → chia 100
  if (cur === "USD" || cur === "EUR" || cur === "GBP") {
    return `${(amount / 100).toFixed(2)} ${cur}`;
  }

  // VND: amount là đồng → không chia
  if (cur === "VND") {
    return `${amount.toLocaleString("vi-VN")} ${cur}`;
  }

  // Default: chia 100
  return `${(amount / 100).toFixed(2)} ${cur}`;
}

function getStatusColor(status: string) {
  switch (status) {
    case "COMPLETED":
      return "success" as const;
    case "FAILED":
      return "danger" as const;
    case "REFUNDED":
      return "warning" as const;
    default:
      return "default" as const;
  }
}

export default function PaymentHistoryTable() {
  const t = useTranslations("subscription.paymentHistory");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchPayments = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `/api/payments/history?page=${page}&limit=10`,
          { withCredentials: true },
        );
        if (cancelled) return;
        setPayments(res.data.data ?? []);
        setTotalPages(res.data.pagination?.totalPages ?? 1);
      } catch {
        if (cancelled) return;
        setPayments([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchPayments();
    return () => {
      cancelled = true;
    };
  }, [page]);

  return (
    <Card className="border border-default-200 p-6 shadow-sm">
      <h2 className="mb-5 text-xl font-bold">{t("title")}</h2>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : payments.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-default-100 text-2xl">
            💳
          </div>
          <p className="font-semibold">{t("empty")}</p>
          <p className="max-w-sm text-sm text-default-500">
            {t("emptyDescription")}
          </p>
        </div>
      ) : (
        <>
          {/* Table (dùng div cho responsive) */}
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              {/* Header */}
              <div className="grid grid-cols-[100px_1fr_120px_100px_80px] gap-3 border-b border-default-200 pb-3 text-xs font-bold uppercase tracking-wider text-default-500">
                <div>{t("columns.date")}</div>
                <div>{t("columns.plan")}</div>
                <div className="text-right">{t("columns.amount")}</div>
                <div className="text-center">{t("columns.status")}</div>
                <div className="text-right">{t("columns.receipt")}</div>
              </div>

              {/* Rows */}
              <div className="divide-y divide-default-100">
                {payments.map((p) => (
                  <div
                    key={p.id}
                    className="grid grid-cols-[100px_1fr_120px_100px_80px] items-center gap-3 py-3 text-sm"
                  >
                    <div className="text-default-600">
                      {new Date(p.paidAt ?? p.createdAt).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-semibold">{p.plan}</span>
                      {p.cardLast4 && (
                        <span className="ml-2 text-xs text-default-400">
                          •••• {p.cardLast4}
                        </span>
                      )}
                    </div>
                    <div className="text-right font-semibold">
                      {formatAmount(p.amount, p.currency)}
                    </div>
                    <div className="text-center">
                      <Chip
                        size="sm"
                        color={getStatusColor(p.status)}
                        variant="primary"
                        className="font-semibold"
                      >
                        {t(`status.${p.status}`)}
                      </Chip>
                    </div>
                    <div className="text-right">
                      {p.receiptUrl ? (
                        <a
                          href={p.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {t("view")}
                        </a>
                      ) : (
                        <span className="text-default-400">—</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-5 flex items-center justify-between">
              <span className="text-xs text-default-500">
                {t("pageInfo", { page, total: totalPages })}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  isDisabled={page === 1}
                  onPress={() => setPage((p) => Math.max(1, p - 1))}
                >
                  {t("prev")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  isDisabled={page === totalPages}
                  onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  {t("next")}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
