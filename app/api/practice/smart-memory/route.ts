"use server";

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/app/api/util/prisma";

export async function DELETE() {
  try {
    const h = await headers();

    const userId = h.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    const result = await prisma.smartMemory.deleteMany({
      where: {
        userId,
      },
    });

    return NextResponse.json({
      success: true,

      deletedCount: result.count,

      message: "Smart Memory has been reset successfully",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      {
        status: 500,
      },
    );
  }
}
