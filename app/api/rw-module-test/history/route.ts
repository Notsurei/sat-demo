"use server";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { Prisma } from "@prisma/client";

import { prisma } from "../../util/prisma";

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("__Host-auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };

    if (!decoded?.userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const url = new URL(request.url);
    const examIdFilter = url.searchParams.get("examId");
    const statusFilter = url.searchParams.get("status");

    const whereClause: Prisma.RwModuleSessionWhereInput = {
      userId: decoded.userId,
      ...(examIdFilter ? { examId: examIdFilter } : {}),
      ...(statusFilter
        ? {
            status: statusFilter as Prisma.RwModuleSessionWhereInput["status"],
          }
        : {}),
    };

    const sessions = await prisma.rwModuleSession.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        examId: true,
        status: true,
        currentSectionOrder: true,
        startedAt: true,
        completedAt: true,
        expiresAt: true,
        lastActivityAt: true,
        timeSpent: true,

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
          orderBy: { examSection: { moduleNumber: "asc" } },
          select: {
            id: true,
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
                questions: { select: { questionId: true } },
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

    const history = sessions.map((s) => {
      const totalQuestions = s.sections.reduce(
        (sum, sec) => sum + sec.examSection.questions.length,
        0,
      );

      const calcCorrect = s.sections.reduce(
        (sum, sec) =>
          sum + sec.answers.filter((a) => a.isCorrect === true).length,
        0,
      );
      const calcWrong = s.sections.reduce(
        (sum, sec) =>
          sum + sec.answers.filter((a) => a.isCorrect === false).length,
        0,
      );

      const totalCorrect = s.totalCorrect ?? calcCorrect;
      const totalWrong = s.totalWrong ?? calcWrong;
      const answered = totalCorrect + totalWrong;
      const totalSkipped =
        s.totalSkipped ?? Math.max(totalQuestions - answered, 0);

      const accuracy =
        answered > 0 ? Number(((totalCorrect / answered) * 100).toFixed(2)) : 0;

      const isExpired =
        s.expiresAt !== null &&
        s.expiresAt.getTime() < Date.now() &&
        s.status === "IN_PROGRESS";

      const sectionStats = s.sections.map((sec) => {
        const secTotal = sec.examSection.questions.length;
        const secCorrect = sec.answers.filter(
          (a) => a.isCorrect === true,
        ).length;
        const secWrong = sec.answers.filter(
          (a) => a.isCorrect === false,
        ).length;
        const secAnswered = secCorrect + secWrong;
        const secUnanswered = Math.max(secTotal - secAnswered, 0);
        const secAccuracy =
          secAnswered > 0
            ? Number(((secCorrect / secAnswered) * 100).toFixed(2))
            : 0;

        return {
          id: sec.id,
          sectionId: sec.examSection.id,
          subject: sec.examSection.subject,
          title: sec.examSection.title,
          order: sec.examSection.order,
          moduleNumber: sec.examSection.moduleNumber,
          variant: sec.examSection.variant,
          status: sec.status,

          total: secTotal,
          answered: secAnswered,
          unanswered: secUnanswered,
          correct: secCorrect,
          incorrect: secWrong,
          accuracy: secAccuracy,

          timeSpent: sec.timeSpent,
          duration: sec.examSection.duration,
          durationSeconds: sec.examSection.duration * 60,

          startedAt: sec.startedAt,
          completedAt: sec.completedAt,
        };
      });

      return {
        id: s.id,
        examId: s.examId,

        exam: {
          id: s.exam.id,
          title: s.exam.title,
          version: s.exam.version,
          totalQuestions: s.exam.totalQuestions,
          duration: s.exam.duration,
        },

        status: s.status,
        isExpired,
        currentSectionOrder: s.currentSectionOrder,

        totalQuestions,
        answered,
        unanswered: totalSkipped,
        correct: totalCorrect,
        incorrect: totalWrong,
        accuracy,

        rawScore: s.rawScore ?? totalCorrect,
        scaledScore: s.scaledScore ?? null,

        timeSpent: s.timeSpent ?? 0,

        startedAt: s.startedAt,
        completedAt: s.completedAt,
        expiresAt: s.expiresAt,
        lastActivityAt: s.lastActivityAt,
        createdAt: s.createdAt,

        sections: sectionStats,
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          sessions: history,

          totals: {
            sessionCount: history.length,
            completedCount: history.filter((h) => h.status === "COMPLETED")
              .length,
            inProgressCount: history.filter(
              (h) => h.status === "IN_PROGRESS" && !h.isExpired,
            ).length,
            totalTimeSpent: history.reduce((sum, h) => sum + h.timeSpent, 0),
          },
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[RwHistory] Error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch RW module history.",
      },
      { status: 500 },
    );
  }
}
