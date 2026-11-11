"use server";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../util/prisma";
import {
  requireAdmin,
  ForbiddenError,
  UnauthorizedError,
} from "../../util/permission";

export async function GET(request: NextRequest) {
  try {
    const role = request.headers.get("x-user-role");
    requireAdmin(role);

    const url = new URL(request.url);
    const pageParam = Number(url.searchParams.get("page") ?? "1");
    const limitParam = Number(url.searchParams.get("limit") ?? "50");

    const page = Math.max(1, Number.isFinite(pageParam) ? pageParam : 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.isFinite(limitParam) ? limitParam : 50),
    );
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          subscriptionPlan: true,
          subscriptionStatus: true,
          isVerified: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count(),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    console.error("[GetAllUsers] Error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 },
    );
  }
}
