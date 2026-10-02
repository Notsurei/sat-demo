"use server";
import { NextResponse } from "next/server";

import { prisma } from "../../../../../util/prisma";

interface RouteContext {
  params: Promise<{
    sessionId: string;
    questionId: string;
  }>;
}

interface AnswerRequest {
  selectedOptionId?: string | null;
  textAnswer?: string | null;
  isFlagged?: boolean;
  timeSpent?: number;
}

export async function PUT(request: Request, context: RouteContext) {
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

    const { sessionId, questionId } = await context.params;

    if (!sessionId || !questionId) {
      return NextResponse.json(
        {
          success: false,
          message: "Session ID and Question ID are required",
        },
        { status: 400 },
      );
    }

    const body: AnswerRequest = await request.json().catch(() => ({}));

    const selectedOptionId = body.selectedOptionId ?? null;

    const textAnswer =
      typeof body.textAnswer === "string" ? body.textAnswer.trim() : null;

    const isFlagged =
      typeof body.isFlagged === "boolean" ? body.isFlagged : undefined;

    const timeSpent =
      typeof body.timeSpent === "number" &&
      Number.isFinite(body.timeSpent) &&
      body.timeSpent >= 0
        ? Math.floor(body.timeSpent)
        : undefined;

    const session = await prisma.fullTestSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
      select: {
        id: true,
        status: true,
        currentSectionOrder: true,

        sections: {
          select: {
            id: true,
            examSectionId: true,
            status: true,
            startedAt: true,
            remainingTime: true,

            examSection: {
              select: {
                id: true,
                order: true,
                duration: true,
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

    if (session.status !== "IN_PROGRESS") {
      return NextResponse.json(
        {
          success: false,
          message: "This test session is not active",
        },
        { status: 409 },
      );
    }

    let sectionSession = session.sections.find(
      (section) => section.examSection.order === session.currentSectionOrder,
    );

    if (!sectionSession) {
      return NextResponse.json(
        {
          success: false,
          message: "Current test section not found",
        },
        { status: 404 },
      );
    }

    if (sectionSession.status === "COMPLETED") {
      return NextResponse.json(
        {
          success: false,
          message: "This section has already been completed",
        },
        { status: 409 },
      );
    }

    if (sectionSession.status === "EXPIRED") {
      return NextResponse.json(
        {
          success: false,
          message: "This section has expired",
        },
        { status: 409 },
      );
    }

    if (sectionSession.status === "NOT_STARTED") {
      const now = new Date();

      const activatedSection = await prisma.fullTestSectionSession.update({
        where: {
          id: sectionSession.id,
        },
        data: {
          status: "IN_PROGRESS",
          startedAt: sectionSession.startedAt ?? now,
          lastActivityAt: now,
          remainingTime:
            sectionSession.remainingTime ??
            sectionSession.examSection.duration * 60,
        },
        select: {
          id: true,
          examSectionId: true,
          status: true,
          startedAt: true,
          remainingTime: true,

          examSection: {
            select: {
              id: true,
              order: true,
              duration: true,
            },
          },
        },
      });

      sectionSession = activatedSection;
    }

    if (sectionSession.status !== "IN_PROGRESS") {
      return NextResponse.json(
        {
          success: false,
          message: "This section is not active",
        },
        { status: 409 },
      );
    }

    const examQuestion = await prisma.examQuestion.findFirst({
      where: {
        examSectionId: sectionSession.examSectionId,
        questionId,
      },
      select: {
        questionId: true,

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

    if (!examQuestion) {
      return NextResponse.json(
        {
          success: false,
          message: "Question does not belong to the current section",
        },
        { status: 400 },
      );
    }

    const question = examQuestion.question;

    if (question.type === "MCQ") {
      if (textAnswer !== null) {
        return NextResponse.json(
          {
            success: false,
            message: "MCQ questions must use selectedOptionId",
          },
          { status: 400 },
        );
      }

      if (selectedOptionId !== null) {
        const option = await prisma.option.findFirst({
          where: {
            id: selectedOptionId,
            questionId: question.id,
          },
          select: {
            id: true,
          },
        });

        if (!option) {
          return NextResponse.json(
            {
              success: false,
              message: "Selected option does not belong to this question",
            },
            { status: 400 },
          );
        }
      }
    }

    if (question.type === "GRID_IN") {
      if (selectedOptionId !== null) {
        return NextResponse.json(
          {
            success: false,
            message: "Grid-in questions must use textAnswer",
          },
          { status: 400 },
        );
      }
    }

    let isCorrect: boolean | null = null;

    if (question.type === "MCQ" && selectedOptionId !== null) {
      const correctOption = await prisma.option.findFirst({
        where: {
          questionId: question.id,
          isCorrect: true,
        },
        select: {
          id: true,
        },
      });

      isCorrect = correctOption?.id === selectedOptionId;
    }

    if (question.type === "GRID_IN" && textAnswer !== null) {
      const correctAnswer =
        question.correctTextAnswer ?? question.correctAnswer;

      if (correctAnswer !== null) {
        isCorrect =
          textAnswer.toLowerCase() === correctAnswer.trim().toLowerCase();
      }
    }

    const existingAnswer = await prisma.fullTestAnswer.findUnique({
      where: {
        fullTestSectionSessionId_questionId: {
          fullTestSectionSessionId: sectionSession.id,
          questionId: question.id,
        },
      },
      select: {
        id: true,
        answeredAt: true,
      },
    });

    const answer = await prisma.fullTestAnswer.upsert({
      where: {
        fullTestSectionSessionId_questionId: {
          fullTestSectionSessionId: sectionSession.id,
          questionId: question.id,
        },
      },

      create: {
        fullTestSectionSessionId: sectionSession.id,

        questionId: question.id,

        selectedOptionId,

        textAnswer,

        isCorrect,

        isFlagged: isFlagged ?? false,

        timeSpent: timeSpent ?? 0,

        answeredAt:
          selectedOptionId !== null || textAnswer !== null ? new Date() : null,
      },

      update: {
        selectedOptionId,

        textAnswer,

        isCorrect,

        ...(isFlagged !== undefined && {
          isFlagged,
        }),

        ...(timeSpent !== undefined && {
          timeSpent,
        }),

        answeredAt:
          selectedOptionId !== null || textAnswer !== null
            ? new Date()
            : (existingAnswer?.answeredAt ?? null),
      },

      select: {
        id: true,
        questionId: true,
        selectedOptionId: true,
        textAnswer: true,
        isCorrect: true,
        isFlagged: true,
        timeSpent: true,
        answeredAt: true,
      },
    });

    const now = new Date();

    await prisma.$transaction([
      prisma.fullTestSession.update({
        where: {
          id: session.id,
        },
        data: {
          lastActivityAt: now,
        },
      }),

      prisma.fullTestSectionSession.update({
        where: {
          id: sectionSession.id,
        },
        data: {
          lastActivityAt: now,
        },
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        message: "Answer saved successfully",
        data: {
          answer,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(
      "PUT /api/full-test/sessions/[sessionId]/answers/[questionId] error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to save answer",
      },
      { status: 500 },
    );
  }
}
