"use server";
import { NextResponse } from "next/server";
import { prisma } from "../../../util/prisma";

interface RouteContext {
  params: Promise<{
    sessionId: string;
  }>;
}

export async function GET(request: Request, context: RouteContext) {
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
    const { sessionId } = await context.params;

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          message: "Session ID is required",
        },
        { status: 400 },
      );
    }

    const session = await prisma.fullTestSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
      select: {
        id: true,
        userId: true,
        examId: true,
        status: true,
        currentSectionOrder: true,
        startedAt: true,
        completedAt: true,
        totalTimeSpent: true,
        lastActivityAt: true,

        exam: {
          select: {
            id: true,
            title: true,
            description: true,
            version: true,
            duration: true,
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
                breakAfter: true,

                questions: {
                  orderBy: {
                    order: "asc",
                  },
                  select: {
                    id: true,
                    questionId: true,
                    order: true,

                    question: {
                      select: {
                        id: true,
                        externalId: true,
                        prompt: true,
                        passage: true,
                        domain: true,
                        subtopic: true,
                        difficulty: true,
                        type: true,

                        options: {
                          orderBy: {
                            label: "asc",
                          },
                          select: {
                            id: true,
                            label: true,
                            content: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },

            answers: {
              select: {
                id: true,
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
        {
          success: false,
          message: "Session not found",
        },
        { status: 404 },
      );
    }

    const sections = session.sections.map((section) => ({
      id: section.id,
      examSectionId: section.examSectionId,
      status: section.status,
      startedAt: section.startedAt,
      completedAt: section.completedAt,
      timeSpent: section.timeSpent,
      remainingTime: section.remainingTime,
      lastActivityAt: section.lastActivityAt,

      section: {
        id: section.examSection.id,
        subject: section.examSection.subject,
        title: section.examSection.title,
        order: section.examSection.order,
        duration: section.examSection.duration,
        durationSeconds: section.examSection.duration * 60,
        breakAfter: section.examSection.breakAfter,
      },

      questions: section.examSection.questions.map((examQuestion) => {
        const answer = section.answers.find(
          (item) => item.questionId === examQuestion.questionId,
        );

        return {
          id: examQuestion.id,
          questionId: examQuestion.questionId,
          order: examQuestion.order,

          question: {
            id: examQuestion.question.id,
            externalId: examQuestion.question.externalId,
            prompt: examQuestion.question.prompt,
            passage: examQuestion.question.passage,
            domain: examQuestion.question.domain,
            subtopic: examQuestion.question.subtopic,
            difficulty: examQuestion.question.difficulty,
            type: examQuestion.question.type,

            options: examQuestion.question.options,
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

    await prisma.fullTestSession.update({
      where: {
        id: session.id,
      },
      data: {
        lastActivityAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          sessionId: session.id,
          status: session.status,
          currentSectionOrder: session.currentSectionOrder,

          startedAt: session.startedAt,
          completedAt: session.completedAt,
          totalTimeSpent: session.totalTimeSpent,

          exam: session.exam,

          sections,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/full-tests/sessions/[sessionId] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch test session",
      },
      { status: 500 },
    );
  }
}
