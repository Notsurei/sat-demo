"use server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { Prisma } from "@prisma/client";

import { prisma } from "../../util/prisma";

type FullTestHistorySession = Prisma.FullTestSessionGetPayload<{
  select: {
    id: true;
    examId: true;
    status: true;
    startedAt: true;
    completedAt: true;
    totalTimeSpent: true;

    totalCorrect: true;
    totalWrong: true;
    totalSkipped: true;

    rawScore: true;
    scaledScore: true;

    createdAt: true;

    exam: {
      select: {
        id: true;
        title: true;
        version: true;
        totalQuestions: true;
        duration: true;
      };
    };

    sections: {
      select: {
        id: true;
        status: true;
        timeSpent: true;
        startedAt: true;
        completedAt: true;

        examSection: {
          select: {
            id: true;
            subject: true;
            title: true;
            order: true;
            duration: true;

            questions: {
              select: {
                id: true;
                questionId: true;
              };
            };
          };
        };

        answers: {
          select: {
            questionId: true;
            isCorrect: true;
            selectedOptionId: true;
            textAnswer: true;
          };
        };
      };
    };
  };
}>;

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };

    if (!decoded?.userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const sessions = await prisma.fullTestSession.findMany({
      where: {
        userId: decoded.userId,
      },

      orderBy: {
        createdAt: "desc",
      },

      select: {
        id: true,
        examId: true,
        status: true,
        startedAt: true,
        completedAt: true,
        totalTimeSpent: true,

        totalCorrect: true,
        totalWrong: true,
        totalSkipped: true,

        rawScore: true,
        scaledScore: true,

        createdAt: true,

        exam: {
          select: {
            id: true,
            title: true,
            version: true,
            totalQuestions: true,
            duration: true,
          },
        },

        sections: {
          select: {
            id: true,
            status: true,
            timeSpent: true,
            startedAt: true,
            completedAt: true,

            examSection: {
              select: {
                id: true,
                subject: true,
                title: true,
                order: true,
                duration: true,

                questions: {
                  select: {
                    id: true,
                    questionId: true,
                  },
                },
              },
            },

            answers: {
              select: {
                questionId: true,
                isCorrect: true,
                selectedOptionId: true,
                textAnswer: true,
              },
            },
          },
        },
      },
    });

    const history = sessions.map((session: FullTestHistorySession) => {
      const totalQuestions = session.exam.totalQuestions;

      const calculatedCorrect = session.sections.reduce(
        (sum: number, section) => {
          const correct = section.answers.filter(
            (answer) => answer.isCorrect === true,
          ).length;

          return sum + correct;
        },
        0,
      );

      const totalCorrect = session.totalCorrect ?? calculatedCorrect;

      const calculatedWrong = session.sections.reduce(
        (sum: number, section) => {
          const wrong = section.answers.filter(
            (answer) => answer.isCorrect === false,
          ).length;

          return sum + wrong;
        },
        0,
      );

      const totalWrong = session.totalWrong ?? calculatedWrong;

      const calculatedSkipped = Math.max(
        totalQuestions - totalCorrect - totalWrong,
        0,
      );

      const totalSkipped = session.totalSkipped ?? calculatedSkipped;

      const answered = totalCorrect + totalWrong;

      const accuracy =
        answered > 0 ? Number(((totalCorrect / answered) * 100).toFixed(2)) : 0;

      const sectionStats = session.sections.map((section) => {
        const total = section.examSection.questions.length;

        const correct = section.answers.filter(
          (answer) => answer.isCorrect === true,
        ).length;

        const wrong = section.answers.filter(
          (answer) => answer.isCorrect === false,
        ).length;

        const answered = correct + wrong;

        const unanswered = Math.max(total - answered, 0);

        const sectionAccuracy =
          answered > 0 ? Number(((correct / answered) * 100).toFixed(2)) : 0;

        return {
          id: section.id,
          sectionId: section.examSection.id,

          subject: section.examSection.subject,
          title: section.examSection.title,
          order: section.examSection.order,

          status: section.status,

          total,
          answered,
          unanswered,

          correct,
          wrong,

          accuracy: sectionAccuracy,

          timeSpent: section.timeSpent,
          duration: section.examSection.duration,

          startedAt: section.startedAt,
          completedAt: section.completedAt,
        };
      });

      return {
        id: session.id,
        examId: session.examId,

        exam: {
          id: session.exam.id,
          title: session.exam.title,
          version: session.exam.version,
          totalQuestions: session.exam.totalQuestions,
          duration: session.exam.duration,
        },

        status: session.status,

        totalQuestions,

        answered,
        unanswered: totalSkipped,

        correct: totalCorrect,
        incorrect: totalWrong,

        accuracy,

        rawScore: session.rawScore ?? totalCorrect,

        scaledScore: session.scaledScore ?? null,

        totalTimeSpent: session.totalTimeSpent ?? 0,

        startedAt: session.startedAt,
        completedAt: session.completedAt,
        createdAt: session.createdAt,

        sections: sectionStats,
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: history,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch full test history.",
      },
      {
        status: 500,
      },
    );
  }
}
