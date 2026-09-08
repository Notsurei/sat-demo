"use server";

import { NextResponse } from "next/server";

import { prisma } from "../../util/prisma";

interface RouteContext {
  params: Promise<{
    examId: string;
  }>;
}

export async function POST(request: Request, context: RouteContext) {
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
        description: true,
        version: true,
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

            _count: {
              select: {
                questions: true,
              },
            },
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

    if (exam.sections.length !== 2) {
      return NextResponse.json(
        {
          message: "Full test must contain exactly 2 sections",
        },
        {
          status: 400,
        },
      );
    }

    const readingSection = exam.sections.find(
      (section) => section.subject === "SAT_RW",
    );

    const mathSection = exam.sections.find(
      (section) => section.subject === "SAT_MATH",
    );

    if (!readingSection) {
      return NextResponse.json(
        {
          message: "Reading and Writing section not found",
        },
        {
          status: 400,
        },
      );
    }

    if (!mathSection) {
      return NextResponse.json(
        {
          message: "Math section not found",
        },
        {
          status: 400,
        },
      );
    }

    if (readingSection._count.questions !== 27) {
      return NextResponse.json(
        {
          message: "Reading and Writing section must contain 27 questions",
        },
        {
          status: 400,
        },
      );
    }
    if (mathSection._count.questions !== 27) {
      return NextResponse.json(
        {
          message: "Math section must contain 27 questions",
        },
        {
          status: 400,
        },
      );
    }

    if (readingSection.duration !== 32) {
      return NextResponse.json(
        {
          message: "Reading and Writing section must have 32 minutes",
        },
        {
          status: 400,
        },
      );
    }

    if (mathSection.duration !== 32) {
      return NextResponse.json(
        {
          message: "Math section must have 32 minutes",
        },
        {
          status: 400,
        },
      );
    }

    const existingSession = await prisma.fullTestSession.findFirst({
      where: {
        userId,
        examId,

        status: {
          in: ["IN_PROGRESS", "BREAK"],
        },
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

            currentSectionOrder: existingSession.currentSectionOrder,
          },
        },
        {
          status: 409,
        },
      );
    }

    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      const session = await tx.fullTestSession.create({
        data: {
          userId,
          examId,

          status: "IN_PROGRESS",

          currentSectionOrder: readingSection.order,

          startedAt: now,
        },
      });

      const readingSession = await tx.fullTestSectionSession.create({
        data: {
          fullTestSessionId: session.id,

          examSectionId: readingSection.id,

          status: "IN_PROGRESS",

          startedAt: now,

          timeSpent: 0,

          remainingTime: readingSection.duration * 60,
        },
      });

      const mathSession = await tx.fullTestSectionSession.create({
        data: {
          fullTestSessionId: session.id,

          examSectionId: mathSection.id,

          status: "NOT_STARTED",

          startedAt: null,

          timeSpent: 0,

          remainingTime: mathSection.duration * 60,
        },
      });

      return {
        session,
        readingSession,
        mathSession,
      };
    });

    return NextResponse.json(
      {
        data: {
          sessionId: result.session.id,

          exam: {
            id: exam.id,

            title: exam.title,

            description: exam.description,

            version: exam.version,

            duration: exam.duration,

            totalQuestions: exam.totalQuestions,
          },

          session: {
            id: result.session.id,

            status: result.session.status,

            currentSectionOrder: result.session.currentSectionOrder,

            startedAt: result.session.startedAt,
          },
          currentSection: {
            sessionId: result.readingSession.id,

            sectionId: readingSection.id,

            subject: readingSection.subject,

            title: readingSection.title,

            order: readingSection.order,

            duration: readingSection.duration,

            remainingTime: readingSection.duration * 60,

            totalQuestions: readingSection._count.questions,
          },

          break: {
            duration: 10 * 60,
          },
        },
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("POST /api/full-tests/[examId]/start error:", error);

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
