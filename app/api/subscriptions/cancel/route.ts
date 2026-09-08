"use server";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/util/prisma";

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.subscription.updateMany({
      where: {
        userId,
        status: "ACTIVE",
      },
      data: {
        status: "CANCELED",
        cancelAtPeriodEnd: true,
      },
    });

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        subscriptionPlan: "FREE",
        nextBillingDate: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Subscription cancelled",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 },
    );
  }
}
