"use server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verify } from "jsonwebtoken";

import { prisma } from "@/app/api/util/prisma";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const decoded = verify(
      token,
      process.env.JWT_SECRET as string,
    ) as {
      userId: string;
    };

    const history = await prisma.practice.findMany({
      where: {
        userId: decoded.userId,
      },
      orderBy: {
        startedAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error("Error fetching history:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Internal Server Error",
      },
      { status: 500 },
    );
  }
}