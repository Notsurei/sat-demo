"use client";

import { useState } from "react";
import { Button, Card, Chip, Modal, Spinner, toast } from "@heroui/react";
import { useTranslations } from "next-intl";
import axios from "axios";
import { useRouter } from "@/i18n/navigation";

interface Subscription {
  id: string;
  plan: string;
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  createdAt: string;
}

interface Props {
  subscription: Subscription | null;
  onRefresh: () => void;
}

const PLAN_META: Record<string, { price: string; emoji: string }> = {
  FREE: { price: "$0.00", emoji: "🌱" },
  BASIC: { price: "$9.99", emoji: "⭐" },
  PREMIUM: { price: "$19.99", emoji: "💎" },
  VIP: { price: "$29.99", emoji: "👑" },
};

export default function CurrentPlanCard({ subscription, onRefresh }: Props) {
  const t = useTranslations("subscription.currentPlan");
  const router = useRouter();

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [canceling, setCanceling] = useState(false);

  if (!subscription) {
    return (
      <Card className="border border-default-200 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">
              {PLAN_META.FREE.emoji} {t("plans.FREE")}
            </h2>
            <p className="mt-1 text-sm text-default-500">
              {t("freeDescription")}
            </p>
          </div>
          <Button
            variant="primary"
            className="font-semibold"
            onPress={() => router.push("/pages/pricing")}
          >
            {t("upgradeButton")}
          </Button>
        </div>
      </Card>
    );
  }


  const meta = PLAN_META[subscription.plan] ?? PLAN_META.FREE;
  const endDate = subscription.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
    : null;

  const handleCancel = async () => {
    try {
      setCanceling(true);
      await axios.post(
        "/api/subscriptions/cancel",
        {},
        { withCredentials: true },
      );
      toast.success(t("cancelSuccess"));
      setShowCancelModal(false);
      onRefresh();
    } catch (err: any) {
      toast.danger(t("cancelFailed"), {
        description: err.response?.data?.error ?? undefined,
      });
    } finally {
      setCanceling(false);
    }
  };

  return (
    <>
      <Card className="border border-primary/20 bg-primary/[0.03] p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold">
                {meta.emoji} {t(`plans.${subscription.plan}`)}
              </h2>

              <Chip
                size="sm"
                color={subscription.cancelAtPeriodEnd ? "warning" : "success"}
                variant="primary"
                className="font-semibold"
              >
                {subscription.cancelAtPeriodEnd
                  ? t("statusCanceling")
                  : t("statusActive")}
              </Chip>
            </div>

            <p className="mt-3 text-lg font-semibold text-foreground">
              {meta.price}
              <span className="ml-1 text-sm font-normal text-default-500">
                {t("perMonth")}
              </span>
            </p>

            {endDate && (
              <p className="mt-3 text-sm text-default-500">
                {subscription.cancelAtPeriodEnd
                  ? t("cancelAt", { date: endDate })
                  : t("nextBilling", { date: endDate })}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onPress={() => router.push("/pages/pricing")}
            >
              {t("changePlan")}
            </Button>

            {!subscription.cancelAtPeriodEnd && (
              <Button
                variant="outline"
                className="border-danger/30 text-danger hover:border-danger hover:bg-danger/5"
                onPress={() => setShowCancelModal(true)}
              >
                {t("cancelButton")}
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Modal
        isOpen={showCancelModal}
        onOpenChange={(open) => {
          if (!open && !canceling) setShowCancelModal(false);
        }}
      >
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="w-[calc(100vw-2rem)] sm:max-w-md">
              {!canceling && <Modal.CloseTrigger />}

              <Modal.Header className="border-b border-default-200">
                <Modal.Heading className="text-lg font-semibold">
                  {t("cancelModal.title")}
                </Modal.Heading>
              </Modal.Header>

              <Modal.Body className="space-y-3 py-4">
                <p className="text-sm leading-6 text-default-600">
                  {t("cancelModal.description", {
                    plan: t(`plans.${subscription.plan}`),
                  })}
                </p>

                {endDate && (
                  <div className="rounded-lg border border-warning/20 bg-warning/5 px-3 py-2 text-sm text-default-600">
                    {t("cancelModal.keepAccessUntil", { date: endDate })}
                  </div>
                )}
              </Modal.Body>

              <Modal.Footer className="border-t border-default-200">
                <div className="flex w-full justify-end gap-2">
                  <Button
                    variant="outline"
                    onPress={() => setShowCancelModal(false)}
                    isDisabled={canceling}
                  >
                    {t("cancelModal.keepButton")}
                  </Button>
                  <Button
                    variant="danger"
                    onPress={handleCancel}
                    isDisabled={canceling}
                    className="min-w-[120px]"
                  >
                    {canceling ? (
                      <Spinner size="sm" color="current" />
                    ) : (
                      t("cancelModal.confirmButton")
                    )}
                  </Button>
                </div>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
