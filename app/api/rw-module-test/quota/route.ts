"use server";

import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/app/api/util/prisma";
import {
  getMathTestLimit,
  isMathTestUnlimited,
  type PlanType,
} from "@/app/api/util/plan-limit";
import { resolveUserSubscription } from "@/app/api/util/subscription";

function getMonthStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const sub = await resolveUserSubscription(userId);
    const plan = sub.plan as PlanType;
    const limit = getMathTestLimit(plan);
    const unlimited = isMathTestUnlimited(plan);

    let used = 0;

    if (!unlimited) {
      const sessions = await prisma.mathModuleSession.findMany({
        where: {
          userId,
          status: { in: ["IN_PROGRESS", "COMPLETED", "EXPIRED"] },
          createdAt: { gte: getMonthStart() },
        },
        select: {
          examSection: { select: { examId: true } },
        },
      });

      used = new Set(sessions.map((s) => s.examSection.examId)).size;
    }

    const remaining = unlimited ? null : Math.max(0, limit - used);
    const canStart = unlimited || (remaining !== null && remaining > 0);

    return NextResponse.json({
      success: true,
      data: {
        plan,
        limit: unlimited ? null : limit,
        used,
        remaining,
        unlimited,
        canStart,
        label: unlimited ? "Unlimited" : canStart ? "Available" : "Locked",
      },
    });
  } catch (error) {
    console.error("[MathModuleQuota] Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to check quota" },
      { status: 500 },
    );
  }
}
