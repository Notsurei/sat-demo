"use server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../util/prisma";

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

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

    const answers = await prisma.userAnswer.findMany({
      where: {
        attempt: {
          userId,
          status: "DONE",
        },
      },
      include: {
        question: {
          select: {
            domain: true,
          },
        },
      },
    });

    const domainMap = new Map<
      string,
      {
        total: number;
        correct: number;
      }
    >();

    for (const answer of answers) {
      const domain = answer.question.domain ?? "Unknown";

      if (!domainMap.has(domain)) {
        domainMap.set(domain, {
          total: 0,
          correct: 0,
        });
      }

      const current = domainMap.get(domain)!;

      current.total++;

      if (answer.isCorrect) {
        current.correct++;
      }
    }

    const result = Array.from(domainMap.entries()).map(([domain, data]) => ({
      domain,
      total: data.total,
      correct: data.correct,
      accuracy: Number(((data.correct / data.total) * 100).toFixed(2)),
    }));

    result.sort((a, b) => b.accuracy - a.accuracy);

    return NextResponse.json(
      {
        userId,
        domains: result,
      },
      {
        status: 200,
      },
    );
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
