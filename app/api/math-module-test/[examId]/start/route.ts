"use server";

import { NextRequest, NextResponse } from "next/server";
import { Subject } from "@prisma/client";
import { prisma } from "../../../util/prisma";

interface RouteContext {
  params: Promise<{ examId: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { examId } = await context.params;

    if (!examId) {
      return NextResponse.json(
        { success: false, message: "Exam ID is required" },
        { status: 400 },
      );
    }

    /* ── Query exam — SAME examId, filter SAT_MATH only ── */
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      select: {
        id: true,
        title: true,
        duration: true,
        totalQuestions: true,
        sections: {
          where: { subject: Subject.SAT_MATH },
          orderBy: { moduleNumber: "asc" },
          select: {
            id: true,
            subject: true,
            title: true,
            order: true,
            duration: true,
            moduleNumber: true,
            breakAfter: true,
          },
        },
      },
    });

    if (!exam) {
      return NextResponse.json(
        { success: false, message: "Exam not found" },
        { status: 404 },
      );
    }

    if (exam.sections.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "This exam has no Math sections",
        },
        { status: 400 },
      );
    }

    if (exam.sections.length !== 2) {
      return NextResponse.json(
        {
          success: false,
          message: `Expected 2 Math sections (M1+M2), got ${exam.sections.length}`,
        },
        { status: 400 },
      );
    }

    /* ── Check user ── */
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 401 },
      );
    }

    /* ── Check active session ── */
    const existingSession = await prisma.mathModuleSession.findFirst({
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
          message: "You already have an active Math test session",
          data: {
            sessionId: existingSession.id,
            status: existingSession.status,
            currentSectionOrder: existingSession.currentSectionOrder,
          },
        },
        { status: 409 },
      );
    }

    /* ── Create parent + section sessions ── */
    const now = new Date();
    const firstSection = exam.sections[0];

    const session = await prisma.$transaction(async (tx) => {
      const newSession = await tx.mathModuleSession.create({
        data: {
          userId: user.id,
          examId: exam.id,
          status: "IN_PROGRESS",
          currentSectionOrder: firstSection.order,
          startedAt: now,
          lastActivityAt: now,
        },
      });

      await tx.mathModuleSectionSession.createMany({
        data: exam.sections.map((section, index) => ({
          mathModuleSessionId: newSession.id,
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

    /* ── Load M1 questions ── */
    const examQuestions = await prisma.examQuestion.findMany({
      where: { examSectionId: firstSection.id },
      orderBy: { order: "asc" },
      select: {
        questionId: true,
        order: true,
        question: {
          select: {
            id: true,
            prompt: true,
            passage: true,
            type: true,
            difficulty: true,
            domain: true,
            subtopic: true,
            options: {
              orderBy: { label: "asc" },
              select: { id: true, label: true, content: true },
            },
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Math module started successfully",
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
            moduleNumber: firstSection.moduleNumber,
            duration: firstSection.duration,
            durationSeconds: firstSection.duration * 60,
            breakAfter: firstSection.breakAfter,
          },

          questions: examQuestions.map((eq) => ({
            questionId: eq.questionId,
            order: eq.order,
            prompt: eq.question.prompt,
            passage: eq.question.passage,
            type: eq.question.type,
            difficulty: eq.question.difficulty,
            domain: eq.question.domain,
            subtopic: eq.question.subtopic,
            options: eq.question.options,
          })),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[MathStart] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to start Math test",
      },
      { status: 500 },
    );
  }
}
