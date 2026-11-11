import { prisma } from "@/app/api/util/prisma";
import { SubscriptionStatus } from "@prisma/client";

export type SubscriptionPlan = "FREE" | "BASIC" | "PREMIUM" | "VIP";

export type ResolvedStatus = "ACTIVE" | "TRIALING" | "PAST_DUE" | "CANCELING";

export interface ResolvedSubscription {
  plan: SubscriptionPlan;
  status: ResolvedStatus;
  source: "billing" | "manual" | "free";
  cancelAtPeriodEnd: boolean;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  isManual: boolean;
  hasAccess: boolean;
}

const ACCESS_STATUSES: SubscriptionStatus[] = [
  SubscriptionStatus.ACTIVE,
  SubscriptionStatus.TRIALING,
  SubscriptionStatus.PAST_DUE,
];

export async function resolveUserSubscription(
  userId: string,
): Promise<ResolvedSubscription> {
  const now = new Date();

  const sub = await prisma.subscription.findFirst({
    where: {
      userId,
      status: { in: ACCESS_STATUSES },
      OR: [{ currentPeriodEnd: null }, { currentPeriodEnd: { gt: now } }],
    },
    orderBy: { createdAt: "desc" },
    select: {
      plan: true,
      status: true,
      cancelAtPeriodEnd: true,
      currentPeriodStart: true,
      currentPeriodEnd: true,
    },
  });

  if (sub) {
    return {
      plan: sub.plan as SubscriptionPlan,
      status: deriveStatus(sub.status, sub.cancelAtPeriodEnd),
      source: "billing",
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      currentPeriodStart: sub.currentPeriodStart?.toISOString() ?? null,
      currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
      isManual: false,
      hasAccess: true,
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionPlan: true,
      subscriptionEndsAt: true,
    },
  });

  const plan = user?.subscriptionPlan as SubscriptionPlan | undefined;

  if (plan && plan !== "FREE") {
    const expiresAt = user?.subscriptionEndsAt;

    if (expiresAt && expiresAt <= now) {
      return freeSubscription();
    }

    return {
      plan,
      status: "ACTIVE",
      source: "manual",
      cancelAtPeriodEnd: false,
      currentPeriodStart: null,
      currentPeriodEnd: expiresAt?.toISOString() ?? null,
      isManual: true,
      hasAccess: true,
    };
  }

  return freeSubscription();
}

function deriveStatus(
  prismaStatus: SubscriptionStatus,
  cancelAtPeriodEnd: boolean,
): ResolvedStatus {
  switch (prismaStatus) {
    case SubscriptionStatus.TRIALING:
      return "TRIALING";
    case SubscriptionStatus.PAST_DUE:
      return "PAST_DUE";
    case SubscriptionStatus.ACTIVE:
      return cancelAtPeriodEnd ? "CANCELING" : "ACTIVE";
    default:
      return "ACTIVE";
  }
}

function freeSubscription(): ResolvedSubscription {
  return {
    plan: "FREE",
    status: "ACTIVE",
    source: "free",
    cancelAtPeriodEnd: false,
    currentPeriodStart: null,
    currentPeriodEnd: null,
    isManual: false,
    hasAccess: true,
  };
}
