export const PLAN_LIMITS = {
  FREE: { fullTest: 0, label: "Locked" },
  BASIC: { fullTest: 2, label: "2 attempts" },
  PREMIUM: { fullTest: 5, label: "5 attempts" },
  VIP: { fullTest: Infinity, label: "Unlimited" },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;

export function getFullTestLimit(plan: string | null | undefined): number {
  const p = (plan ?? "FREE") as PlanType;
  return PLAN_LIMITS[p]?.fullTest ?? 0;
}

export function isFullTestUnlimited(plan: string | null | undefined): boolean {
  return getFullTestLimit(plan) === Infinity;
}