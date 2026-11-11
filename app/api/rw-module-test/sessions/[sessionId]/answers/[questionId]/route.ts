"use server";

import { NextResponse } from "next/server";
import { prisma } from "@/app/api/util/prisma";

interface RouteContext {
  params: Promise<{ sessionId: string; questionId: string }>;
}

interface AnswerBody {
  selectedOptionId?: string | null;
  textAnswer?: string | null;
  isFlagged?: boolean;
  timeSpent?: number;
}

const MAX_TIME_MULTIPLIER = 1.5;

export async function PUT(request: Request, context: RouteContext) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { sessionId, questionId } = await context.params;
    const body: AnswerBody = await request.json().catch(() => ({}));

    const selectedOptionId = body.selectedOptionId ?? null;
    const textAnswer =
      typeof body.textAnswer === "string" ? body.textAnswer.trim() : null;
    const isFlagged =
      typeof body.isFlagged === "boolean" ? body.isFlagged : undefined;
    const rawTimeSpent =
      typeof body.timeSpent === "number" && body.timeSpent >= 0
        ? Math.floor(body.timeSpent)
        : undefined;

    const session = await prisma.rwModuleSession.findFirst({
      where: { id: sessionId, userId },
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
            examSection: { select: { id: true, order: true, duration: true } },
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Session not found" },
        { status: 404 },
      );
    }

    if (session.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { success: false, message: "Session not active" },
        { status: 409 },
      );
    }

    let sectionSession = session.sections.find(
      (s) => s.examSection.order === session.currentSectionOrder,
    );

    if (!sectionSession) {
      return NextResponse.json(
        { success: false, message: "Current section not found" },
        { status: 404 },
      );
    }

    if (sectionSession.status === "COMPLETED") {
      return NextResponse.json(
        { success: false, message: "Section already completed" },
        { status: 409 },
      );
    }

    if (sectionSession.status === "NOT_STARTED") {
      const now = new Date();
      sectionSession = await prisma.rwModuleSectionSession.update({
        where: { id: sectionSession.id },
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
          examSection: { select: { id: true, order: true, duration: true } },
        },
      });
    }

    const sectionDurationSec = sectionSession.examSection.duration * 60;
    const maxAllowed = Math.floor(sectionDurationSec * MAX_TIME_MULTIPLIER);
    const timeSpent =
      rawTimeSpent !== undefined
        ? Math.min(rawTimeSpent, maxAllowed)
        : undefined;

    const examQuestion = await prisma.examQuestion.findFirst({
      where: { examSectionId: sectionSession.examSectionId, questionId },
      select: {
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
        { success: false, message: "Question not in current section" },
        { status: 400 },
      );
    }

    const question = examQuestion.question;
    let isCorrect: boolean | null = null;

    if (question.type === "MCQ" && selectedOptionId) {
      const correct = await prisma.option.findFirst({
        where: { questionId: question.id, isCorrect: true },
        select: { id: true },
      });
      isCorrect = correct?.id === selectedOptionId;
    }

    if (question.type === "GRID_IN" && textAnswer) {
      const expected = question.correctTextAnswer ?? question.correctAnswer;
      if (expected) {
        isCorrect = textAnswer.toLowerCase() === expected.trim().toLowerCase();
      }
    }

    const existing = await prisma.rwModuleAnswer.findUnique({
      where: {
        rwModuleSectionSessionId_questionId: {
          rwModuleSectionSessionId: sectionSession.id,
          questionId: question.id,
        },
      },
      select: { id: true, answeredAt: true, timeSpent: true },
    });

    const hasAnswerNow =
      selectedOptionId !== null || (textAnswer !== null && textAnswer !== "");

    const answeredAt = existing?.answeredAt
      ? existing.answeredAt
      : hasAnswerNow
        ? new Date()
        : null;

    const nextTimeSpent =
      timeSpent !== undefined
        ? Math.max(existing?.timeSpent ?? 0, timeSpent)
        : undefined;

    const answer = await prisma.rwModuleAnswer.upsert({
      where: {
        rwModuleSectionSessionId_questionId: {
          rwModuleSectionSessionId: sectionSession.id,
          questionId: question.id,
        },
      },
      create: {
        rwModuleSectionSessionId: sectionSession.id,
        questionId: question.id,
        selectedOptionId,
        textAnswer,
        isCorrect,
        isFlagged: isFlagged ?? false,
        timeSpent: timeSpent ?? 0,
        answeredAt,
      },
      update: {
        selectedOptionId,
        textAnswer,
        isCorrect,
        ...(isFlagged !== undefined && { isFlagged }),
        ...(nextTimeSpent !== undefined && { timeSpent: nextTimeSpent }),
        answeredAt,
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
      prisma.rwModuleSession.update({
        where: { id: session.id },
        data: { lastActivityAt: now },
      }),
      prisma.rwModuleSectionSession.update({
        where: { id: sectionSession.id },
        data: { lastActivityAt: now },
      }),
    ]);

    return NextResponse.json({ success: true, data: { answer } });
  } catch (error) {
    console.error("[RwAnswer] Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to save answer" },
      { status: 500 },
    );
  }
}
