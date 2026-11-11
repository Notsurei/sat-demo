"use server";

import { NextRequest, NextResponse } from "next/server";
import { resolveUserSubscription } from "@/app/api/util/subscription";

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const resolved = await resolveUserSubscription(userId);

    return NextResponse.json({
      success: true,
      subscription:
        resolved.source === "free"
          ? null
          : {
              id: `resolved-${resolved.source}-${userId}`,
              plan: resolved.plan,
              status: resolved.status,
              cancelAtPeriodEnd: resolved.cancelAtPeriodEnd,
              currentPeriodStart: resolved.currentPeriodStart,
              currentPeriodEnd: resolved.currentPeriodEnd,
              createdAt: new Date().toISOString(),
              isManual: resolved.isManual,
            },
    });
  } catch (error) {
    console.error("[SubscriptionCurrent] Error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong." },
      { status: 500 },
    );
  }
}
