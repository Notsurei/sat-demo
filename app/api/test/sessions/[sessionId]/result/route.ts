"use server";
import { NextResponse } from "next/server";

import { prisma } from "../../../../util/prisma";

interface RouteContext {
  params: Promise<{
    sessionId: string;
  }>;
}

export async function GET(request: Request, context: RouteContext) {
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
        completedAt: true,
        totalTimeSpent: true,

        exam: {
          select: {
            id: true,
            title: true,
            version: true,
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
            timeSpent: true,

            examSection: {
              select: {
                id: true,
                subject: true,
                title: true,
                order: true,

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
              },
            },
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

    if (session.status !== "COMPLETED") {
      return NextResponse.json(
        {
          message: "Test has not been completed",
        },
        {
          status: 409,
        },
      );
    }

    const sections = session.sections.map((section) => {
      const total = section.examSection.questions.length;

      const answered = section.answers.filter(
        (answer) => !!answer.selectedOptionId || !!answer.textAnswer?.trim(),
      ).length;

      const correct = section.answers.filter(
        (answer) => answer.isCorrect === true,
      ).length;

      const incorrect = section.answers.filter(
        (answer) => answer.isCorrect === false,
      ).length;

      const unanswered = total - answered;

      const accuracy =
        answered > 0 ? Number(((correct / answered) * 100).toFixed(2)) : 0;

      return {
        sectionId: section.examSection.id,

        subject: section.examSection.subject,

        title: section.examSection.title,

        order: section.examSection.order,

        total,

        answered,

        correct,

        incorrect,

        unanswered,

        accuracy,

        timeSpent: section.timeSpent,
      };
    });

    const summary = sections.reduce(
      (acc, section) => {
        acc.totalQuestions += section.total;

        acc.answered += section.answered;

        acc.correct += section.correct;

        acc.incorrect += section.incorrect;

        acc.unanswered += section.unanswered;

        return acc;
      },
      {
        totalQuestions: 0,
        answered: 0,
        correct: 0,
        incorrect: 0,
        unanswered: 0,
      },
    );

    const accuracy =
      summary.answered > 0
        ? Number(((summary.correct / summary.answered) * 100).toFixed(2))
        : 0;

    return NextResponse.json(
      {
        data: {
          session: {
            id: session.id,

            status: session.status,

            startedAt: session.startedAt,

            completedAt: session.completedAt,

            totalTimeSpent: session.totalTimeSpent,
          },

          exam: session.exam,

          summary: {
            ...summary,
            accuracy,
          },

          sections,
        },
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(
      "GET /api/full-tests/sessions/[sessionId]/result error:",
      error,
    );

    return NextResponse.json(
      {
        message: "Failed to fetch full test result",
      },
      {
        status: 500,
      },
    );
  }
}
