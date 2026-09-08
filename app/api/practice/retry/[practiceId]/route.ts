"use server";

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import { prisma } from "@/app/api/util/prisma";

type Params = {
  params: Promise<{
    practiceId: string;
  }>;
};

const RETRY_TIME_LIMIT = 60;

export async function POST(
  request: NextRequest,
  { params }: Params,
) {
  try {
    const { practiceId } = await params;

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

    const practice = await prisma.practice.findFirst({
      where: {
        id: practiceId,
        userId,
      },

      include: {
        answers: {
          where: {
            OR: [
              {
                isCorrect: false,
              },

              {
                timeSpent: {
                  gt: RETRY_TIME_LIMIT,
                },
              },
            ],
          },

          select: {
            questionId: true,
            isCorrect: true,
            timeSpent: true,
          },
        },
      },
    });

    if (!practice) {
      return NextResponse.json(
        {
          success: false,
          error: "Practice not found",
        },
        {
          status: 404,
        },
      );
    }

    const retryQuestionIds = practice.answers.map(
      (answer) => answer.questionId,
    );

    if (retryQuestionIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Great job! You have no incorrect or slow questions to retry.",

          code: "NO_RETRY_QUESTIONS",
        },
        {
          status: 400,
        },
      );
    }

    const retryPractice = await prisma.practice.create({
      data: {
        userId,

        subject: practice.subject,

        domain: practice.domain,

        subtopic: practice.subtopic,

        totalQuestions: retryQuestionIds.length,

        mode: practice.mode,

        parentPracticeId: practice.id,
      },
    });

    await prisma.practiceAnswer.createMany({
      data: retryQuestionIds.map((questionId) => ({
        practiceId: retryPractice.id,

        questionId,

        isCorrect: false,

        timeSpent: 0,
      })),
    });

    const questions = await prisma.question.findMany({
      where: {
        id: {
          in: retryQuestionIds,
        },
      },

      include: {
        options: true,
      },
    });

    const incorrectCount = practice.answers.filter(
      (answer) => answer.isCorrect === false,
    ).length;

    const slowCount = practice.answers.filter(
      (answer) =>
        answer.timeSpent > RETRY_TIME_LIMIT,
    ).length;

    const bothCount = practice.answers.filter(
      (answer) =>
        answer.isCorrect === false &&
        answer.timeSpent > RETRY_TIME_LIMIT,
    ).length;

    return NextResponse.json(
      {
        success: true,

        practiceId: retryPractice.id,

        parentPracticeId: practice.id,

        totalQuestions: retryQuestionIds.length,

        retryInfo: {
          total: retryQuestionIds.length,

          incorrect: incorrectCount,

          slow: slowCount,

          both: bothCount,

          timeLimit: RETRY_TIME_LIMIT,
        },

        questions,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "Retry practice error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Internal Server Error",
      },
      {
        status: 500,
      },
    );
  }
}