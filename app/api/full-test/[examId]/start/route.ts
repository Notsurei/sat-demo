"use server";

import { NextResponse } from "next/server";
import { prisma } from "../../../util/prisma";

interface RouteContext {
  params: Promise<{
    examId: string;
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

    const { examId } = await context.params;

    if (!examId) {
      return NextResponse.json(
        {
          success: false,
          message: "Exam ID is required",
        },
        { status: 400 },
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
          success: false,
          message: "Exam not found",
        },
        { status: 404 },
      );
    }

    if (exam.sections.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "This exam has no sections",
        },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 401 },
      );
    }

    const existingSession = await prisma.fullTestSession.findFirst({
      where: {
        userId: user.id,
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
          success: false,
          message: "You already have an active full test session",
          data: {
            sessionId: existingSession.id,
            status: existingSession.status,
            currentSectionOrder: existingSession.currentSectionOrder,
          },
        },
        { status: 409 },
      );
    }

    const now = new Date();
    const firstSection = exam.sections[0];

    const session = await prisma.$transaction(async (tx) => {
      const newSession = await tx.fullTestSession.create({
        data: {
          userId: user.id,
          examId: exam.id,
          status: "IN_PROGRESS",
          currentSectionOrder: firstSection.order,
          startedAt: now,
          lastActivityAt: now,
        },
      });

      await tx.fullTestSectionSession.createMany({
        data: exam.sections.map((section, index) => ({
          fullTestSessionId: newSession.id,
          examSectionId: section.id,
          status: index === 0 ? "IN_PROGRESS" : "NOT_STARTED",
          startedAt: index === 0 ? now : null,
          timeSpent: 0,
          remainingTime: section.duration * 60,
          lastActivityAt: now,
        })),
      });

      return newSession;
    });

    return NextResponse.json(
      {
        success: true,
        message: "Full test started successfully",
        data: {
          sessionId: session.id,
          examId: exam.id,
          status: session.status,
          currentSectionOrder: session.currentSectionOrder,
          startedAt: session.startedAt,

          exam: {
            id: exam.id,
            title: exam.title,
            duration: exam.duration,
            totalQuestions: exam.totalQuestions,
          },

          currentSection: {
            id: firstSection.id,
            subject: firstSection.subject,
            title: firstSection.title,
            order: firstSection.order,
            duration: firstSection.duration,
            durationSeconds: firstSection.duration * 60,
            breakAfter: firstSection.breakAfter,
          },
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/full-test/[examId]/start error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to start full test",
      },
      { status: 500 },
    );
  }
}
