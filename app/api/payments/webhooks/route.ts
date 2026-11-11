import { NextRequest, NextResponse } from "next/server";
import DodoPayments from "dodopayments";
import { SubscriptionPlan } from "@prisma/client";
import { prisma } from "@/app/api/util/prisma";

export const runtime = "nodejs";

// ✅ Lazy init — không chạy lúc build
function getDodoClient(): DodoPayments {
  const apiKey = process.env.DODO_API_KEY;
  const webhookSecret = process.env.DODO_WEBHOOK_SECRET;

  if (!apiKey || !webhookSecret) {
    throw new Error(
      "Missing DODO_API_KEY or DODO_WEBHOOK_SECRET. Configure Vercel env vars.",
    );
  }

  const environment =
    process.env.DODO_ENVIRONMENT === "live_mode" ? "live_mode" : "test_mode";

  return new DodoPayments({
    bearerToken: apiKey,
    environment,
    webhookKey: webhookSecret,
  });
}

const PLAN_MAP: Record<string, SubscriptionPlan> = {
  BASIC: SubscriptionPlan.BASIC,
  PREMIUM: SubscriptionPlan.PREMIUM,
  VIP: SubscriptionPlan.VIP,
};

function getSubscriptionPlan(value: unknown): SubscriptionPlan | null {
  if (typeof value !== "string") return null;
  return PLAN_MAP[value.toUpperCase()] ?? null;
}

function extractMeta(data: any): {
  userId?: string;
  plan?: string;
} {
  const metadata =
    data?.metadata ??
    data?.subscription?.metadata ??
    data?.customer?.metadata ??
    {};

  const userId = metadata?.userId ?? metadata?.user_id;
  const plan = metadata?.plan;

  return {
    userId: typeof userId === "string" && userId.trim() ? userId : undefined,
    plan: typeof plan === "string" ? plan.toUpperCase() : undefined,
  };
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getSubscriptionId(data: any): string | null {
  const id = data?.subscription_id ?? data?.id;
  return typeof id === "string" && id.length > 0 ? id : null;
}

function getUserId(data: any): string | undefined {
  return extractMeta(data).userId;
}

async function claimWebhookEvent(
  webhookId: string,
  eventType: string,
): Promise<boolean> {
  try {
    await prisma.dodoWebhookEvent.create({
      data: {
        id: webhookId,
        type: eventType,
        status: "PROCESSING",
      },
    });
    return true;
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return false;
    }
    throw error;
  }
}

async function markWebhookCompleted(webhookId: string) {
  await prisma.dodoWebhookEvent.update({
    where: { id: webhookId },
    data: { status: "PROCESSED", processedAt: new Date() },
  });
}

async function releaseWebhookClaim(webhookId: string) {
  await prisma.dodoWebhookEvent.deleteMany({
    where: { id: webhookId, status: "PROCESSING" },
  });
}

async function handleSubscriptionActive(data: any) {
  const { userId, plan: rawPlan } = extractMeta(data);
  const plan = getSubscriptionPlan(rawPlan);
  const subscriptionId = getSubscriptionId(data);

  if (!userId || !plan || !subscriptionId) {
    throw new Error(
      "subscription.active is missing userId, plan, or subscription ID",
    );
  }

  const nextBillingDate = parseDate(
    data?.next_billing_date ?? data?.current_period_end,
  );

  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionPlan: plan,
      subscriptionStatus: "ACTIVE",
      subscriptionId,
      ...(nextBillingDate ? { subscriptionEndsAt: nextBillingDate } : {}),
    },
  });

  console.info("[Dodo] Subscription activated", {
    userId,
    plan,
    subscriptionId,
  });
}

async function handleSubscriptionRenewed(data: any) {
  const userId = getUserId(data);
  const subscriptionId = getSubscriptionId(data);

  if (!userId || !subscriptionId) {
    throw new Error(
      "subscription.renewed is missing userId or subscription ID",
    );
  }

  const nextBillingDate = parseDate(
    data?.next_billing_date ?? data?.current_period_end,
  );

  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionStatus: "ACTIVE",
      ...(nextBillingDate ? { subscriptionEndsAt: nextBillingDate } : {}),
    },
  });

  console.info("[Dodo] Subscription renewed", { userId, subscriptionId });
}

async function handleSubscriptionEnded(data: any) {
  const userId = getUserId(data);
  const subscriptionId = getSubscriptionId(data);

  if (!userId || !subscriptionId) {
    throw new Error(
      "Subscription end event is missing userId or subscription ID",
    );
  }

  const result = await prisma.user.updateMany({
    where: { id: userId, subscriptionId },
    data: {
      subscriptionStatus: "CANCELLED",
      subscriptionPlan: SubscriptionPlan.FREE,
      subscriptionId: null,
      subscriptionEndsAt: null,
    },
  });

  console.info("[Dodo] Subscription ended", {
    userId,
    subscriptionId,
    updated: result.count,
  });
}

async function handleSubscriptionPaymentIssue(
  data: any,
  status: "ON_HOLD" | "PAST_DUE",
) {
  const userId = getUserId(data);
  const subscriptionId = getSubscriptionId(data);

  if (!userId || !subscriptionId) {
    throw new Error("Subscription payment issue event is missing metadata");
  }

  await prisma.user.updateMany({
    where: { id: userId, subscriptionId },
    data: { subscriptionStatus: status },
  });

  console.warn("[Dodo] Subscription payment issue", {
    userId,
    subscriptionId,
    status,
  });
}

async function handlePaymentSucceeded(data: any) {
  const { userId, plan } = extractMeta(data);

  if (!userId) {
    console.warn("[Dodo] payment.succeeded missing userId", {
      paymentId: data?.payment_id ?? data?.id,
    });
    return;
  }

  console.info("[Dodo] Payment succeeded", {
    userId,
    plan,
    paymentId: data?.payment_id ?? data?.id,
    amount: data?.total_amount ?? data?.amount,
  });
}

async function handlePaymentFailed(data: any, status: "FAILED" | "CANCELLED") {
  console.warn("[Dodo] Payment status changed", {
    userId: getUserId(data),
    paymentId: data?.payment_id ?? data?.id,
    status,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();

    const webhookId = req.headers.get("webhook-id");
    const webhookSignature = req.headers.get("webhook-signature");
    const webhookTimestamp = req.headers.get("webhook-timestamp");

    if (!webhookId || !webhookSignature || !webhookTimestamp) {
      return NextResponse.json(
        { error: "Missing webhook headers" },
        { status: 400 },
      );
    }

    // ✅ Lazy init trong handler — không còn throw lúc build
    const dodo = getDodoClient();

    let event;
    try {
      event = dodo.webhooks.unwrap(body, {
        headers: {
          "webhook-id": webhookId,
          "webhook-signature": webhookSignature,
          "webhook-timestamp": webhookTimestamp,
        },
      });
    } catch (error) {
      console.error("[Dodo] Invalid webhook signature", error);
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 },
      );
    }

    let claimed = false;

    try {
      claimed = await claimWebhookEvent(webhookId, event.type);

      if (!claimed) {
        const existing = await prisma.dodoWebhookEvent.findUnique({
          where: { id: webhookId },
          select: { status: true },
        });

        if (existing?.status === "PROCESSED") {
          return NextResponse.json({
            received: true,
            message: "Already processed",
          });
        }

        return NextResponse.json(
          { error: "Webhook event is already being processed" },
          { status: 503 },
        );
      }

      const data = event.data as any;

      switch (event.type) {
        case "subscription.active":
          await handleSubscriptionActive(data);
          break;
        case "subscription.renewed":
          await handleSubscriptionRenewed(data);
          break;
        case "subscription.cancelled":
        case "subscription.expired":
          await handleSubscriptionEnded(data);
          break;
        case "subscription.on_hold":
          await handleSubscriptionPaymentIssue(data, "ON_HOLD");
          break;
        case "subscription.past_due":
          await handleSubscriptionPaymentIssue(data, "PAST_DUE");
          break;
        case "payment.succeeded":
          await handlePaymentSucceeded(data);
          break;
        case "payment.failed":
          await handlePaymentFailed(data, "FAILED");
          break;
        case "payment.cancelled":
          await handlePaymentFailed(data, "CANCELLED");
          break;
        default:
          console.info("[Dodo] Unhandled event", event.type);
      }

      await markWebhookCompleted(webhookId);
      return NextResponse.json({ received: true });
    } catch (error) {
      console.error("[Dodo] Webhook processing failed", {
        webhookId,
        eventType: event.type,
        error,
      });

      if (claimed) {
        try {
          await releaseWebhookClaim(webhookId);
        } catch (releaseError) {
          console.error("[Dodo] Failed to release webhook claim", releaseError);
        }
      }

      return NextResponse.json(
        { error: "Webhook processing failed" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("[Dodo] Webhook env/setup error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error && error.message.includes("DODO_")
            ? error.message
            : "Webhook setup error",
      },
      { status: 500 },
    );
  }
}
