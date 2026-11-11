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
    const limitParam = Number(url.searchParams.get("limit") ?? "10");

    const page = Math.max(1, Number.isFinite(pageParam) ? pageParam : 1);
    const limit = Math.min(
      50,
      Math.max(1, Number.isFinite(limitParam) ? limitParam : 10),
    );
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          amount: true,
          currency: true,
          status: true,
          plan: true,
          paidAt: true,
          createdAt: true,
          cardBrand: true,
          cardLast4: true,
          receiptUrl: true,
        },
      }),
      prisma.payment.count({ where: { userId } }),
    ]);

    return NextResponse.json({
      success: true,
      data: payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[PaymentsHistory] Error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
