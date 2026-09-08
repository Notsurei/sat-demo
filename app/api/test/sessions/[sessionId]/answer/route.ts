"use server";
import { NextResponse } from "next/server";

import { prisma } from "../../../../util/prisma";

interface RouteContext {
  params: Promise<{
    sessionId: string;
  }>;
}

interface AnswerBody {
  sectionSessionId: string;
  questionId: string;

  selectedOptionId?: string | null;
  textAnswer?: string | null;

  timeSpent?: number;
  isFlagged?: boolean;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const userId = "CURRENT_USER_ID";

    const { sessionId } = await context.params;

    const body = (await request.json()) as AnswerBody;

    const {
      sectionSessionId,
      questionId,
      selectedOptionId = null,
      textAnswer = null,
      timeSpent = 0,
      isFlagged = false,
    } = body;

    if (!sectionSessionId) {
      return NextResponse.json(
        {
          message: "Section session ID is required",
        },
        {
          status: 400,
        },
      );
    }

    if (!questionId) {
      return NextResponse.json(
        {
          message: "Question ID is required",
        },
        {
          status: 400,
        },
      );
    }

    if (typeof timeSpent !== "number" || timeSpent < 0) {
      return NextResponse.json(
        {
          message: "Invalid timeSpent",
        },
        {
          status: 400,
        },
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
        currentSectionOrder: true,
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
          message: "This test session is not active",
        },
        {
          status: 409,
        },
      );
    }

    const sectionSession = await prisma.fullTestSectionSession.findFirst({
      where: {
        id: sectionSessionId,

        fullTestSessionId: sessionId,
      },

      select: {
        id: true,
        status: true,
        examSectionId: true,
        examSection: {
          select: {
            order: true,
            duration: true,
          },
        },
      },
    });

    if (!sectionSession) {
      return NextResponse.json(
        {
          message: "Section session not found",
        },
        {
          status: 404,
        },
      );
    }

    if (sectionSession.examSection.order !== session.currentSectionOrder) {
      return NextResponse.json(
        {
          message: "This is not the current section",
        },
        {
          status: 409,
        },
      );
    }

    if (sectionSession.status !== "IN_PROGRESS") {
      return NextResponse.json(
        {
          message: "This section is not active",
        },
        {
          status: 409,
        },
      );
    }

    if (!sectionSession.examSection) {
      return NextResponse.json(
        {
          message: "Exam section not found",
        },
        {
          status: 404,
        },
      );
    }

    const examQuestion = await prisma.examQuestion.findFirst({
      where: {
        examSectionId: sectionSession.examSectionId,

        questionId,
      },

      select: {
        question: {
          select: {
            id: true,
            type: true,
          },
        },
      },
    });

    if (!examQuestion) {
      return NextResponse.json(
        {
          message: "Question does not belong to this section",
        },
        {
          status: 400,
        },
      );
    }

    const question = examQuestion.question;

    if (question.type === "MCQ") {
      if (textAnswer) {
        return NextResponse.json(
          {
            message: "MCQ cannot have textAnswer",
          },
          {
            status: 400,
          },
        );
      }

      if (selectedOptionId) {
        const option = await prisma.option.findFirst({
          where: {
            id: selectedOptionId,
            questionId,
          },

          select: {
            id: true,
          },
        });

        if (!option) {
          return NextResponse.json(
            {
              message: "Selected option does not belong to this question",
            },
            {
              status: 400,
            },
          );
        }
      }
    }

    if (question.type === "GRID_IN") {
      if (selectedOptionId) {
        return NextResponse.json(
          {
            message: "GRID_IN cannot have selectedOptionId",
          },
          {
            status: 400,
          },
        );
      }
    }

    const answer = await prisma.fullTestAnswer.upsert({
      where: {
        fullTestSectionSessionId_questionId: {
          fullTestSectionSessionId: sectionSessionId,

          questionId,
        },
      },

      create: {
        fullTestSectionSessionId: sectionSessionId,

        questionId,

        selectedOptionId,

        textAnswer,

        timeSpent,

        isFlagged,

        answeredAt: selectedOptionId || textAnswer ? new Date() : null,
      },

      update: {
        selectedOptionId,

        textAnswer,

        timeSpent,

        isFlagged,

        answeredAt: selectedOptionId || textAnswer ? new Date() : null,
      },

      select: {
        id: true,
        questionId: true,
        selectedOptionId: true,
        textAnswer: true,
        timeSpent: true,
        isFlagged: true,
        answeredAt: true,
      },
    });

    return NextResponse.json(
      {
        data: {
          answer,
        },
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(
      "PATCH /api/full-tests/sessions/[sessionId]/answer error:",
      error,
    );

    return NextResponse.json(
      {
        message: "Failed to save answer",
      },
      {
        status: 500,
      },
    );
  }
}
