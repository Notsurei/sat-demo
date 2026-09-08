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
    const userId = "CURRENT_USER_ID";

    const { sessionId } = await context.params;

    if (!sessionId) {
      return NextResponse.json(
        {
          message: "Session ID is required",
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
        startedAt: true,
        completedAt: true,
        totalTimeSpent: true,

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
            status: true,
            startedAt: true,
            completedAt: true,
            timeSpent: true,
            remainingTime: true,

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
                    order: true,

                    question: {
                      select: {
                        id: true,
                        prompt: true,
                        passage: true,
                        type: true,
                        domain: true,
                        subtopic: true,

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
                timeSpent: true,
                isFlagged: true,
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
          message: "Session not found",
        },
        {
          status: 404,
        },
      );
    }

    const sections = session.sections.map((sectionSession) => {
      const answersMap = new Map(
        sectionSession.answers.map((answer) => [answer.questionId, answer]),
      );

      const questions = sectionSession.examSection.questions.map(
        (examQuestion) => {
          const answer = answersMap.get(examQuestion.question.id);

          return {
            id: examQuestion.question.id,

            order: examQuestion.order,

            type: examQuestion.question.type,

            prompt: examQuestion.question.prompt,

            passage: examQuestion.question.passage,

            domain: examQuestion.question.domain,

            subtopic: examQuestion.question.subtopic,

            options: examQuestion.question.options,

            answer: answer
              ? {
                  selectedOptionId: answer.selectedOptionId,

                  textAnswer: answer.textAnswer,

                  timeSpent: answer.timeSpent,

                  isFlagged: answer.isFlagged,

                  answeredAt: answer.answeredAt,
                }
              : null,
          };
        },
      );

      return {
        sessionId: sectionSession.id,

        sectionId: sectionSession.examSection.id,

        subject: sectionSession.examSection.subject,

        title: sectionSession.examSection.title,

        order: sectionSession.examSection.order,

        duration: sectionSession.examSection.duration,

        breakAfter: sectionSession.examSection.breakAfter,

        status: sectionSession.status,

        startedAt: sectionSession.startedAt,

        completedAt: sectionSession.completedAt,

        timeSpent: sectionSession.timeSpent,

        remainingTime: sectionSession.remainingTime,

        questions,
      };
    });

    const currentSection =
      sections.find(
        (section) => section.order === session.currentSectionOrder,
      ) ?? null;

    return NextResponse.json(
      {
        data: {
          session: {
            id: session.id,
            status: session.status,

            currentSectionOrder: session.currentSectionOrder,

            startedAt: session.startedAt,

            completedAt: session.completedAt,

            totalTimeSpent: session.totalTimeSpent,
          },

          exam: session.exam,

          currentSection,

          sections,
        },
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("GET /api/full-tests/sessions/[sessionId] error:", error);

    return NextResponse.json(
      {
        message: "Failed to fetch full test session",
      },
      {
        status: 500,
      },
    );
  }
}
