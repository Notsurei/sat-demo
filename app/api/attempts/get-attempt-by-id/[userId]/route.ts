"use server";

import { NextResponse } from "next/server";
import { prisma } from "@/app/api/util/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;

  if (!userId) {
    return NextResponse.json(
      {
        message: "User id is required",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        attempts: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          message: "User not found",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        success: true,
        userId: user.id,
        attempts: user.attempts,
        totalAttempts: user.attempts.length,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: "Internal server error",
      },
      {
        status: 500,
      },
    );
  }
}
