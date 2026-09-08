"use server";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../util/prisma";

export async function GET(request: NextRequest) {
  try {
    const userId = await request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        {
          error: "User ID is required",
        },
        {
          status: 400,
        },
      );
    }

    const latestAttempt = await prisma.attempt.findFirst({
      where: {
        userId,
        status: "DONE",
      },
      include: {
        exam: true,
      },
      orderBy: {
        submittedAt: "desc",
      },
    });

    if (!latestAttempt) {
      return NextResponse.json(
        {
          error: "No attempts found",
        },
        {
          status: 404,
        },
      );
    }
    return NextResponse.json({
      attemptId: latestAttempt.id,
      score: latestAttempt.score,
      correctAnswers: latestAttempt.correctAnswers,
      submittedAt: latestAttempt.submittedAt,
      exam: {
        id: latestAttempt.exam.id,
        title: latestAttempt.exam.title,
        subject: latestAttempt.exam.subject,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      {
        status: 500,
      },
    );
  }
}
