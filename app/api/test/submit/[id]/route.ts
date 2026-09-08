"use server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../util/prisma";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: examId } = await context.params;
    const body = await request.json();

    const { attemptId } = body;

    if (!attemptId) {
      return NextResponse.json(
        {
          error: "Attempt ID is required",
        },
        {
          status: 400,
        },
      );
    }

    const attempt = await prisma.attempt.findFirst({
      where: {
        id: attemptId,
        examId,
      },
      include: {
        exam: true,
        answers: {
          include: {
            question: true,
            selectedOption: true,
          },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json(
        {
          error: "Attempt not found",
        },
        {
          status: 404,
        },
      );
    }

    if (attempt.status === "DONE") {
      return NextResponse.json(
        {
          error: "Exam already submitted",
        },
        {
          status: 400,
        },
      );
    }

    let correctAnswers = 0;

    const answerUpdates = [];

    for (const answer of attempt.answers) {
      let isCorrect = false;

      if (answer.question.type === "MCQ") {
        isCorrect = answer.selectedOption?.isCorrect ?? false;
      }

      if (answer.question.type === "GRID_IN") {
        isCorrect =
          answer.textAnswer?.trim() ===
          answer.question.correctTextAnswer?.trim();
      }

      if (isCorrect) {
        correctAnswers++;
      }

      answerUpdates.push(
        prisma.userAnswer.update({
          where: {
            id: answer.id,
          },
          data: {
            isCorrect,
          },
        }),
      );
    }

    await prisma.$transaction(answerUpdates);

    const score = Math.round(
      (correctAnswers / attempt.exam.totalQuestions) * 100,
    );

    const updatedAttempt = await prisma.attempt.update({
      where: {
        id: attempt.id,
      },
      data: {
        status: "DONE",
        submittedAt: new Date(),
        correctAnswers,
        score,
      },
    });

    return NextResponse.json(
      {
        success: true,
        attemptId: updatedAttempt.id,
        score,
        correctAnswers,
        totalQuestions: attempt.exam.totalQuestions,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(error);

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
