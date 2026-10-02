"use server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../util/prisma";
import jwt from "jsonwebtoken";
import {
  getFullTestLimit,
  isFullTestUnlimited,
  PLAN_LIMITS,
  type PlanType,
} from "@/app/api/util/plan-limit";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { subscriptionPlan: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    const plan = user.subscriptionPlan as PlanType;
    const limit = getFullTestLimit(plan);
    const unlimited = isFullTestUnlimited(plan);

    const used = await prisma.fullTestSession.count({
      where: {
        userId: decoded.userId,
        status: { in: ["IN_PROGRESS", "BREAK", "COMPLETED"] },
      },
    });

    const remaining = unlimited ? Infinity : Math.max(0, limit - used);
    const canStart = unlimited || remaining > 0;

    return NextResponse.json({
      success: true,
      data: {
        plan,
        limit: unlimited ? null : limit,
        used,
        remaining: unlimited ? null : remaining,
        unlimited,
        canStart,
        label: PLAN_LIMITS[plan]?.label ?? "Locked",
      },
    });
  } catch (error) {
    console.error("Quota check error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to check quota" },
      { status: 500 },
    );
  }
}
