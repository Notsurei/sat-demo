"use server";
import { NextResponse } from "next/server";

import { prisma } from "../../../../util/prisma";

interface RouteContext {
  params: Promise<{
    sessionId: string;
  }>;
}

function normalizeAnswer(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return value.trim().replace(/\s+/g, "").replace(/,/g, "");
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const userId = "CURRENT_USER_ID";

    const { sessionId } = await context.params;

    const session = await prisma.fullTestSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },

      select: {
        id: true,
        status: true,
        startedAt: true,

        exam: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        {
          message: "Session not found",
        },
        {
          status: 404,
        },
      );
    }

    if (session.status !== "IN_PROGRESS") {
      return NextResponse.json(
        {
          message: "This session cannot be submitted",
        },
        {
          status: 409,
        },
      );
    }

    const answers = await prisma.fullTestAnswer.findMany({
      where: {
        fullTestSectionSession: {
          fullTestSessionId: sessionId,
        },
      },

      select: {
        id: true,
        questionId: true,
        selectedOptionId: true,
        textAnswer: true,

        question: {
          select: {
            id: true,
            type: true,
            correctAnswer: true,
            correctTextAnswer: true,
          },
        },
      },
    });

    const gradedAnswers = answers.map((answer) => {
      let isCorrect = false;

      if (answer.question.type === "MCQ") {
        isCorrect =
          !!answer.selectedOptionId &&
          answer.selectedOptionId === answer.question.correctAnswer;
      }

      if (answer.question.type === "GRID_IN") {
        isCorrect =
          normalizeAnswer(answer.textAnswer) ===
          normalizeAnswer(answer.question.correctTextAnswer);
      }

      return {
        id: answer.id,
        questionId: answer.questionId,
        isCorrect,
      };
    });

    const result = await prisma.$transaction(async (tx) => {
      for (const answer of gradedAnswers) {
        await tx.fullTestAnswer.update({
          where: {
            id: answer.id,
          },

          data: {
            isCorrect: answer.isCorrect,
          },
        });
      }

      const correct = gradedAnswers.filter((answer) => answer.isCorrect).length;

      const totalQuestions = await tx.examQuestion.count({
        where: {
          examSection: {
            examId: session.exam.id,
          },
        },
      });

      const answered = answers.filter(
        (answer) => !!answer.selectedOptionId || !!answer.textAnswer?.trim(),
      ).length;

      const incorrect = gradedAnswers.filter(
        (answer) => !answer.isCorrect,
      ).length;

      const unanswered = Math.max(totalQuestions - answered, 0);

      const now = new Date();

      await tx.fullTestSectionSession.updateMany({
        where: {
          fullTestSessionId: sessionId,

          status: "IN_PROGRESS",
        },

        data: {
          status: "COMPLETED",

          completedAt: now,

          remainingTime: 0,
        },
      });

      const updatedSession = await tx.fullTestSession.update({
        where: {
          id: sessionId,
        },

        data: {
          status: "COMPLETED",

          completedAt: now,

          totalTimeSpent: session.startedAt
            ? Math.floor((now.getTime() - session.startedAt.getTime()) / 1000)
            : null,
        },
      });

      return {
        session: updatedSession,

        summary: {
          totalQuestions,
          answered,
          correct,
          incorrect,
          unanswered,
        },
      };
    });

    return NextResponse.json(
      {
        data: {
          sessionId: result.session.id,

          status: result.session.status,

          summary: result.summary,
        },
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(
      "POST /api/full-tests/sessions/[sessionId]/submit error:",
      error,
    );

    return NextResponse.json(
      {
        message: "Failed to submit full test",
      },
      {
        status: 500,
      },
    );
  }
}
