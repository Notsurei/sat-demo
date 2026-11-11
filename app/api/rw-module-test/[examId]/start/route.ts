"use server";

import { NextRequest, NextResponse } from "next/server";
import { Subject } from "@prisma/client";

import { prisma } from "@/app/api/util/prisma";
import {
  getRwTestLimit,
  isRwTestUnlimited,
  type PlanType,
} from "@/app/api/util/plan-limit";
import { resolveUserSubscription } from "@/app/api/util/subscription";

interface RouteContext {
  params: Promise<{ examId: string }>;
}

function getMonthStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
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
        { success: false, message: "Exam ID required" },
        { status: 400 },
      );
    }

    const sub = await resolveUserSubscription(userId);
    const plan = sub.plan as PlanType;
    const limit = getRwTestLimit(plan);
    const unlimited = isRwTestUnlimited(plan);

    if (!unlimited) {
      const used = await prisma.rwModuleSession.count({
        where: {
          userId,
          status: { in: ["IN_PROGRESS", "COMPLETED"] },
          createdAt: { gte: getMonthStart() },
        },
      });

      if (used >= limit) {
        return NextResponse.json(
          {
            success: false,
            code: "QUOTA_EXCEEDED",
            error: `You've reached your limit (${limit} RW tests this month).`,
            data: { plan, limit, used, remaining: 0 },
          },
          { status: 403 },
        );
      }
    }

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      select: {
        id: true,
        title: true,
        duration: true,
        totalQuestions: true,
        sections: {
          where: { subject: Subject.SAT_RW },
          orderBy: { moduleNumber: "asc" },
          select: {
            id: true,
            subject: true,
            title: true,
            order: true,
            duration: true,
            moduleNumber: true,
            variant: true,
            _count: { select: { questions: true } },
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

    if (exam.sections.length !== 2) {
      return NextResponse.json(
        {
          success: false,
          message: `Expected 2 RW sections (M1+M2), got ${exam.sections.length}`,
        },
        { status: 400 },
      );
    }

    const m1 = exam.sections[0];

    if (m1._count.questions === 0) {
      return NextResponse.json(
        { success: false, message: "Module 1 has no questions" },
        { status: 400 },
      );
    }

    const existing = await prisma.rwModuleSession.findFirst({
      where: { userId, examId, status: "IN_PROGRESS" },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: "You already have an active RW test",
          code: "ACTIVE_SESSION_EXISTS",
          data: { sessionId: existing.id },
        },
        { status: 409 },
      );
    }

    const now = new Date();

    const session = await prisma.$transaction(async (tx) => {
      const parent = await tx.rwModuleSession.create({
        data: {
          userId,
          examId,
          status: "IN_PROGRESS",
          currentSectionOrder: m1.order,
          startedAt: now,
          lastActivityAt: now,
        },
      });

      await tx.rwModuleSectionSession.createMany({
        data: exam.sections.map((s, idx) => ({
          rwModuleSessionId: parent.id,
          examSectionId: s.id,
          status: idx === 0 ? "IN_PROGRESS" : "NOT_STARTED",
          startedAt: idx === 0 ? now : null,
          timeSpent: 0,
          remainingTime: s.duration * 60,
          lastActivityAt: now,
        })),
      });

      return parent;
    });

    const examQuestions = await prisma.examQuestion.findMany({
      where: { examSectionId: m1.id },
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
        data: {
          sessionId: session.id,
          examId: exam.id,
          status: session.status,
          currentSectionOrder: m1.order,
          startedAt: session.startedAt,
          exam: {
            id: exam.id,
            title: exam.title,
            duration: exam.duration,
            totalQuestions: exam.totalQuestions,
          },
          currentSection: {
            id: m1.id,
            moduleNumber: m1.moduleNumber,
            subject: m1.subject,
            title: m1.title,
            order: m1.order,
            duration: m1.duration,
            durationSeconds: m1.duration * 60,
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
    console.error("[RwStart] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to start RW test",
      },
      { status: 500 },
    );
  }
}
