'use server';
import { NextResponse } from "next/server";

import { prisma } from "../../../util/prisma";

interface RouteContext {
  params: Promise<{
    examId: string;
  }>;
}

export async function POST(
  request: Request,
  context: RouteContext,
) {
  try {
    const userId = "CURRENT_USER_ID";

    const { examId } = await context.params;

    if (!examId) {
      return NextResponse.json(
        {
          message: "Exam ID is required",
        },
        {
          status: 400,
        },
      );
    }

    const exam = await prisma.exam.findUnique({
      where: {
        id: examId,
      },
      select: {
        id: true,
        title: true,
        duration: true,
        totalQuestions: true,

        sections: {
          orderBy: {
            order: "asc",
          },
          select: {
            id: true,
            subject: true,
            title: true,
            order: true,
            duration: true,
            breakAfter: true,
          },
        },
      },
    });

    if (!exam) {
      return NextResponse.json(
        {
          message: "Exam not found",
        },
        {
          status: 404,
        },
      );
    }

    if (exam.sections.length === 0) {
      return NextResponse.json(
        {
          message: "This exam has no sections",
        },
        {
          status: 400,
        },
      );
    }

    const existingSession =
      await prisma.fullTestSession.findFirst({
        where: {
          userId,
          examId,
          status: "IN_PROGRESS",
        },
        select: {
          id: true,
          status: true,
          currentSectionOrder: true,
        },
      });

    if (existingSession) {
      return NextResponse.json(
        {
          message: "You already have an active session for this exam",
          data: {
            sessionId: existingSession.id,
            status: existingSession.status,
            currentSectionOrder:
              existingSession.currentSectionOrder,
          },
        },
        {
          status: 409,
        },
      );
    }

    const session = await prisma.$transaction(async (tx) => {
      const firstSection = exam.sections[0];

      const newSession =
        await tx.fullTestSession.create({
          data: {
            userId,
            examId: exam.id,
            status: "IN_PROGRESS",
            currentSectionOrder: firstSection.order,
          },
        });

      await tx.fullTestSectionSession.createMany({
        data: exam.sections.map((section, index) => ({
          fullTestSessionId: newSession.id,
          examSectionId: section.id,

          status:
            index === 0
              ? "IN_PROGRESS"
              : "NOT_STARTED",

          startedAt:
            index === 0
              ? new Date()
              : null,

          remainingTime: section.duration,
        })),
      });

      return newSession;
    });

    return NextResponse.json(
      {
        data: {
          sessionId: session.id,
          examId: exam.id,
          status: session.status,
          currentSectionOrder:
            session.currentSectionOrder,

          exam: {
            id: exam.id,
            title: exam.title,
            duration: exam.duration,
            totalQuestions: exam.totalQuestions,
          },
        },
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "POST /api/full-tests/[examId]/start error:",
      error,
    );

    return NextResponse.json(
      {
        message: "Failed to start full test",
      },
      {
        status: 500,
      },
    );
  }
}

