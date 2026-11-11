"use server";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/util/prisma";
import { getDodoClient } from "@/app/api/util/dodo";

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await prisma.subscription.findFirst({
      where: { userId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        dodoSubscriptionId: true,
        cancelAtPeriodEnd: true,
        currentPeriodEnd: true,
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { success: false, error: "No active subscription to cancel" },
        { status: 404 },
      );
    }

    if (subscription.cancelAtPeriodEnd) {
      return NextResponse.json({
        success: true,
        message: "Subscription is already scheduled for cancellation",
        cancelAt: subscription.currentPeriodEnd,
      });
    }

    if (!subscription.dodoSubscriptionId) {
      console.error("[Cancel] No dodoSubscriptionId found", {
        subscriptionId: subscription.id,
      });
      return NextResponse.json(
        {
          success: false,
          error: "Subscription cannot be canceled. Please contact support.",
        },
        { status: 400 },
      );
    }

    // ✅ Lazy init — chỉ tạo client khi thực sự cần
    let dodo;
    try {
      dodo = getDodoClient();
    } catch (envError) {
      console.error("[Cancel] Dodo env not configured:", envError);
      return NextResponse.json(
        {
          success: false,
          error: "Payment service not configured. Please contact support.",
        },
        { status: 500 },
      );
    }

    try {
      await dodo.subscriptions.update(subscription.dodoSubscriptionId, {
        cancel_at_next_billing_date: true,
      });
    } catch (err) {
      console.error("[Cancel] Dodo cancel failed:", err);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to cancel subscription. Please contact support.",
        },
        { status: 502 },
      );
    }

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: true,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Subscription will be canceled at the end of the current billing period",
      cancelAt: subscription.currentPeriodEnd,
    });
  } catch (error) {
    console.error("[Cancel] Error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
