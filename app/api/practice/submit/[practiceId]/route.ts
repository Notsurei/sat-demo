"use server";

import { NextResponse } from "next/server";
import { prisma } from "@/app/api/util/prisma";

interface SubmitAnswer {
  optionId?: string;
  textAnswer?: string;
}

export async function POST(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ practiceId: string }>;
  },
) {
  try {
    const { practiceId } = await params;

    const body = await request.json().catch(() => ({}));

    const answers: Record<string, SubmitAnswer> =
      body.answers ?? {};

    const questionTimes: Record<string, number> =
      body.questionTimes ?? {};

    const practice = await prisma.practice.findUnique({
      where: {
        id: practiceId,
      },

      include: {
        answers: true,
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

    if (practice.status === "DONE") {
      return NextResponse.json({
        success: true,
        practice,
        alreadySubmitted: true,
      });
    }

    for (const [questionId, answer] of Object.entries(
      answers,
    )) {
      const question = await prisma.question.findUnique({
        where: {
          id: questionId,
        },

        include: {
          options: true,
        },
      });

      if (!question) {
        continue;
      }

      let isCorrect = false;

      if (answer.optionId) {
        const selectedOption =
          question.options.find(
            (option) =>
              option.id === answer.optionId,
          );

        isCorrect =
          selectedOption?.isCorrect === true;
      }

      else if (
        answer.textAnswer !== undefined
      ) {
        const userAnswer =
          answer.textAnswer
            .trim()
            .toLowerCase();

        const correctAnswer = (
          question.correctTextAnswer ??
          question.correctAnswer ??
          ""
        )
          .trim()
          .toLowerCase();

        isCorrect =
          correctAnswer.length > 0 &&
          userAnswer === correctAnswer;
      }

      const questionTime = Math.max(
        0,
        Number(questionTimes[questionId] ?? 0),
      );

      await prisma.practiceAnswer.upsert({
        where: {
          practiceId_questionId: {
            practiceId: practice.id,
            questionId,
          },
        },

        create: {
          practiceId: practice.id,

          questionId,

          selectedOptionId:
            answer.optionId ?? null,

          textAnswer:
            answer.textAnswer ?? null,

          isCorrect,

          timeSpent: questionTime,
        },

        update: {
          selectedOptionId:
            answer.optionId ?? null,

          textAnswer:
            answer.textAnswer ?? null,

          isCorrect,

          timeSpent: questionTime,
        },
      });
    }

    const savedAnswers =
      await prisma.practiceAnswer.findMany({
        where: {
          practiceId: practice.id,
        },
      });

    const correctAnswers =
      savedAnswers.filter(
        (answer) =>
          answer.isCorrect === true,
      ).length;

    const answeredQuestions =
      savedAnswers.filter(
        (answer) =>
          answer.selectedOptionId !== null ||
          answer.textAnswer !== null,
      ).length;

    const totalQuestions =
      practice.totalQuestions;

    const score =
      totalQuestions > 0
        ? Math.round(
            (correctAnswers /
              totalQuestions) *
              100,
          )
        : 0;

    const completedAt = new Date();

    const totalTimeSpent = Math.max(
      0,
      Math.floor(
        (completedAt.getTime() -
          practice.startedAt.getTime()) /
          1000,
      ),
    );

    const updated =
      await prisma.practice.update({
        where: {
          id: practice.id,
        },

        data: {
          correctAnswers,

          answeredQuestions,

          score,

          timeSpent: totalTimeSpent,

          completedAt,

          status: "DONE",
        },
      });

    return NextResponse.json({
      success: true,

      practice: updated,

      answers: savedAnswers,
    });
  } catch (error) {
    console.error(
      "Submit practice error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Failed to submit practice",
      },
      {
        status: 500,
      },
    );
  }
}