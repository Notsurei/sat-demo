"use server";
import { NextResponse } from "next/server";

import { prisma } from "../../../../util/prisma";

interface RouteContext {
  params: Promise<{
    sessionId: string;
  }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const { sessionId } = await context.params;

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          message: "Session ID is required",
        },
        { status: 400 },
      );
    }

    const session = await prisma.fullTestSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
      select: {
        id: true,
        status: true,
        startedAt: true,
        examId: true,

        exam: {
          select: {
            id: true,
            totalQuestions: true,
          },
        },

        sections: {
          orderBy: {
            examSection: {
              order: "asc",
            },
          },

          select: {
            id: true,
            status: true,
            startedAt: true,
            completedAt: true,
            timeSpent: true,

            examSection: {
              select: {
                id: true,
                order: true,
                duration: true,
                breakAfter: true,

                questions: {
                  select: {
                    questionId: true,
                  },
                },
              },
            },

            answers: {
              select: {
                questionId: true,
                selectedOptionId: true,
                textAnswer: true,
                isCorrect: true,
                timeSpent: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Session not found",
        },
        { status: 404 },
      );
    }

    if (session.status === "COMPLETED") {
      return NextResponse.json(
        {
          success: false,
          message: "This test has already been submitted",
        },
        { status: 409 },
      );
    }

    if (session.status !== "IN_PROGRESS" && session.status !== "BREAK") {
      return NextResponse.json(
        {
          success: false,
          message: "This test session cannot be submitted",
        },
        { status: 409 },
      );
    }

    const allAnswers = session.sections.flatMap((section) => section.answers);

    const answeredAnswers = allAnswers.filter(
      (answer) =>
        answer.selectedOptionId !== null || answer.textAnswer !== null,
    );

    const totalQuestions = session.exam.totalQuestions;

    const correctAnswers = allAnswers.filter(
      (answer) => answer.isCorrect === true,
    ).length;

    const wrongAnswers = allAnswers.filter(
      (answer) => answer.isCorrect === false,
    ).length;

    const skippedAnswers = Math.max(totalQuestions - answeredAnswers.length, 0);

    const rawScore = correctAnswers;

    const now = new Date();

    const totalTimeSpent = Math.max(
      Math.floor((now.getTime() - session.startedAt.getTime()) / 1000),
      0,
    );

    const result = await prisma.$transaction(async (tx) => {
      const completedSession = await tx.fullTestSession.update({
        where: {
          id: session.id,
        },

        data: {
          status: "COMPLETED",
          completedAt: now,
          totalTimeSpent,

          totalCorrect: correctAnswers,
          totalWrong: wrongAnswers,
          totalSkipped: skippedAnswers,

          rawScore,
          scaledScore: null,
        },

        select: {
          id: true,
          status: true,
          startedAt: true,
          completedAt: true,
          totalTimeSpent: true,
          totalCorrect: true,
          totalWrong: true,
          totalSkipped: true,
          rawScore: true,
          scaledScore: true,
        },
      });

      await tx.fullTestSectionSession.updateMany({
        where: {
          fullTestSessionId: session.id,
          status: {
            not: "COMPLETED",
          },
        },

        data: {
          status: "COMPLETED",
          completedAt: now,
        },
      });

      return completedSession;
    });

    const sections = session.sections.map((section) => {
      const sectionAnswers = section.answers;

      const sectionTotal = section.examSection.questions.length;

      const sectionAnswered = sectionAnswers.filter(
        (answer) =>
          answer.selectedOptionId !== null || answer.textAnswer !== null,
      ).length;

      const sectionCorrect = sectionAnswers.filter(
        (answer) => answer.isCorrect === true,
      ).length;

      const sectionWrong = sectionAnswers.filter(
        (answer) => answer.isCorrect === false,
      ).length;

      const sectionSkipped = Math.max(sectionTotal - sectionAnswered, 0);

      return {
        sectionId: section.examSection.id,

        order: section.examSection.order,

        totalQuestions: sectionTotal,

        answeredQuestions: sectionAnswered,

        correctAnswers: sectionCorrect,

        wrongAnswers: sectionWrong,

        skippedAnswers: sectionSkipped,

        accuracy:
          sectionAnswered > 0
            ? Number(((sectionCorrect / sectionAnswered) * 100).toFixed(2))
            : 0,

        timeSpent: section.timeSpent,
      };
    });

    return NextResponse.json(
      {
        success: true,

        message: "Full test submitted successfully",

        data: {
          sessionId: result.id,
          status: result.status,

          summary: {
            totalQuestions,

            answeredQuestions: answeredAnswers.length,

            correctAnswers: result.totalCorrect,

            wrongAnswers: result.totalWrong,

            skippedAnswers: result.totalSkipped,

            rawScore: result.rawScore,

            scaledScore: result.scaledScore,

            totalTimeSpent: result.totalTimeSpent,

            startedAt: result.startedAt,

            completedAt: result.completedAt,
          },

          sections,
        },
      },

      { status: 200 },
    );
  } catch (error) {
    console.error(
      "POST /api/full-test/sessions/[sessionId]/submit error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to submit full test",
      },
      { status: 500 },
    );
  }
}
