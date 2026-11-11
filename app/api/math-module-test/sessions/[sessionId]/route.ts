"use server";

import { NextResponse } from "next/server";
import { prisma } from "@/app/api/util/prisma";

interface RouteContext {
  params: Promise<{ sessionId: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { sessionId } = await context.params;

    const session = await prisma.mathModuleSession.findFirst({
      where: { id: sessionId, userId },
      select: {
        id: true,
        examId: true,
        status: true,
        currentSectionOrder: true,
        startedAt: true,
        completedAt: true,
        lastActivityAt: true,
        totalCorrect: true,
        totalWrong: true,
        totalSkipped: true,
        rawScore: true,
        scaledScore: true,
        exam: {
          select: {
            id: true,
            title: true,
            duration: true,
            totalQuestions: true,
          },
        },
        sections: {
          orderBy: { examSection: { moduleNumber: "asc" } },
          select: {
            id: true,
            examSectionId: true,
            status: true,
            startedAt: true,
            completedAt: true,
            timeSpent: true,
            remainingTime: true,
            lastActivityAt: true,
            examSection: {
              select: {
                id: true,
                subject: true,
                title: true,
                order: true,
                duration: true,
                moduleNumber: true,
                variant: true,
                questions: {
                  orderBy: { order: "asc" },
                  select: {
                    questionId: true,
                    order: true,
                    question: {
                      select: {
                        id: true,
                        prompt: true,
                        passage: true,
                        domain: true,
                        subtopic: true,
                        difficulty: true,
                        type: true,
                        options: {
                          orderBy: { label: "asc" },
                          select: { id: true, label: true, content: true },
                        },
                      },
                    },
                  },
                },
              },
            },
            answers: {
              select: {
                questionId: true,
                selectedOptionId: true,
                textAnswer: true,
                isFlagged: true,
                timeSpent: true,
                answeredAt: true,
              },
            },
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

    const sections = session.sections.map((s) => ({
      id: s.id,
      examSectionId: s.examSectionId,
      status: s.status,
      startedAt: s.startedAt,
      completedAt: s.completedAt,
      timeSpent: s.timeSpent,
      remainingTime: s.remainingTime,
      lastActivityAt: s.lastActivityAt,
      section: {
        id: s.examSection.id,
        subject: s.examSection.subject,
        title: s.examSection.title,
        order: s.examSection.order,
        duration: s.examSection.duration,
        durationSeconds: s.examSection.duration * 60,
        moduleNumber: s.examSection.moduleNumber,
        variant: s.examSection.variant,
      },
      questions: s.examSection.questions.map((eq) => {
        const answer = s.answers.find((a) => a.questionId === eq.questionId);
        return {
          questionId: eq.questionId,
          order: eq.order,
          question: {
            id: eq.question.id,
            prompt: eq.question.prompt,
            passage: eq.question.passage,
            domain: eq.question.domain,
            subtopic: eq.question.subtopic,
            difficulty: eq.question.difficulty,
            type: eq.question.type,
            options: eq.question.options,
          },
          answer: answer
            ? {
                selectedOptionId: answer.selectedOptionId,
                textAnswer: answer.textAnswer,
                isFlagged: answer.isFlagged,
                timeSpent: answer.timeSpent,
                answeredAt: answer.answeredAt,
              }
            : null,
        };
      }),
    }));

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.id,
        examId: session.examId,
        status: session.status,
        currentSectionOrder: session.currentSectionOrder,
        startedAt: session.startedAt,
        completedAt: session.completedAt,
        lastActivityAt: session.lastActivityAt,
        totals: {
          correct: session.totalCorrect,
          wrong: session.totalWrong,
          skipped: session.totalSkipped,
          rawScore: session.rawScore,
          scaledScore: session.scaledScore,
        },
        exam: session.exam,
        sections,
      },
    });
  } catch (error) {
    console.error("[MathSession] Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch session" },
      { status: 500 },
    );
  }
}
