"use server";

import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/app/api/util/prisma";
import {
  getRwTestLimit,
  isRwTestUnlimited,
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
    const limit = getRwTestLimit(plan);
    const unlimited = isRwTestUnlimited(plan);

    let used = 0;

    if (!unlimited) {
      const sessions = await prisma.rwModuleSession.findMany({
        where: {
          userId,
          status: { in: ["IN_PROGRESS", "COMPLETED", "EXPIRED"] },
          createdAt: { gte: getMonthStart() },
        },
        select: {
          examId: true, // ✅ RwModuleSession có examId trực tiếp
        },
      });

      used = new Set(sessions.map((s) => s.examId)).size;
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
    console.error("[RwModuleQuota] Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to check quota" },
      { status: 500 },
    );
  }
}
