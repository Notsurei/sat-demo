import { NextResponse } from "next/server";
import { prisma } from "../../../util/prisma";
import {
  requireAdmin,
  ForbiddenError,
  UnauthorizedError,
} from "@/app/api/util/permission";
import { z } from "zod";

const ParamsSchema = z.object({
  id: z.string().trim().min(1).max(100),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const role = request.headers.get("x-user-role");

    requireAdmin(role);

    const rawParams = await params;
    const parsed = ParamsSchema.safeParse(rawParams);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid user ID",
        },
        { status: 400 },
      );
    }

    const { id } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        subscriptionEndsAt: true,
        isVerified: true,
        phone: true,
        gender: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: user,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden",
        },
        { status: 403 },
      );
    }

    console.error("[GetUser] Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Server error",
      },
      { status: 500 },
    );
  }
}
