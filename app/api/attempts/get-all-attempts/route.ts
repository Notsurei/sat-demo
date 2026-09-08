"use server";

import { NextResponse } from "next/server";
import { prisma } from "../../util/prisma";

export async function GET() {
  try {
    const attempts = await prisma.attempt.findMany({
      orderBy: {
        startedAt: "desc",
      },
    });

    return NextResponse.json(attempts);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 },
    );
  }
}
