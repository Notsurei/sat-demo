export const PLAN_LIMITS = {
  FREE: {
    fullTest: 0,
    mathTest: 0,
    rwTest: 0,
    label: "Locked",
  },
  BASIC: {
    fullTest: 2,
    mathTest: 4,
    rwTest: 4,
    label: "2 attempts",
  },
  PREMIUM: {
    fullTest: 5,
    mathTest: 10,
    rwTest: 10,
    label: "5 attempts",
  },
  VIP: {
    fullTest: Infinity,
    mathTest: Infinity,
    rwTest: Infinity,
    label: "Unlimited",
  },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;

export function getFullTestLimit(plan: string | null | undefined): number {
  const p = (plan ?? "FREE") as PlanType;
  return PLAN_LIMITS[p]?.fullTest ?? 0;
}

export function isFullTestUnlimited(
  plan: string | null | undefined,
): boolean {
  return getFullTestLimit(plan) === Infinity;
}

export function getMathTestLimit(plan: string | null | undefined): number {
  const p = (plan ?? "FREE") as PlanType;
  return PLAN_LIMITS[p]?.mathTest ?? 0;
}

export function isMathTestUnlimited(
  plan: string | null | undefined,
): boolean {
  return getMathTestLimit(plan) === Infinity;
}

export function getRwTestLimit(plan: string | null | undefined): number {
  const p = (plan ?? "FREE") as PlanType;
  return PLAN_LIMITS[p]?.rwTest ?? 0;
}

export function isRwTestUnlimited(
  plan: string | null | undefined,
): boolean {
  return getRwTestLimit(plan) === Infinity;
}