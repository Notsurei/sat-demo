"use server";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/util/prisma";

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const url = new URL(request.url);
    const pageParam = Number(url.searchParams.get("page") ?? "1");
    const limitParam = Number(url.searchParams.get("limit") ?? "20");

    const page = Math.max(1, Number.isFinite(pageParam) ? pageParam : 1);
    const limit = Math.min(
      50,
      Math.max(1, Number.isFinite(limitParam) ? limitParam : 20),
    );
    const skip = (page - 1) * limit;

    const statusFilter = url.searchParams.get("status");

    const where: {
      userId: string;
      status?:
        | "ACTIVE"
        | "CANCELED"
        | "PAST_DUE"
        | "TRIALING"
        | "INCOMPLETE"
        | "UNPAID";
    } = { userId };

    if (
      statusFilter &&
      [
        "ACTIVE",
        "CANCELED",
        "PAST_DUE",
        "TRIALING",
        "INCOMPLETE",
        "UNPAID",
      ].includes(statusFilter)
    ) {
      where.status = statusFilter as typeof where.status;
    }

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          plan: true,
          status: true,
          cancelAtPeriodEnd: true,
          currentPeriodStart: true,
          currentPeriodEnd: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.subscription.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: subscriptions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[SubscriptionHistory] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Something went wrong. Please try again.",
      },
      { status: 500 },
    );
  }
}
