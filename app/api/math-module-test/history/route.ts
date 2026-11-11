"use server";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

import { prisma } from "@/app/api/util/prisma";

export async function GET() {
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

    /* ── NEW SCHEMA: query qua sections[] ── */
    const sessions = await prisma.mathModuleSession.findMany({
      where: { userId: decoded.userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        examId: true,
        status: true,
        startedAt: true,
        completedAt: true,
        createdAt: true,
        timeSpent: true,
        totalCorrect: true,
        totalWrong: true,
        totalSkipped: true,
        rawScore: true,
        scaledScore: true,
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
            examSection: {
              select: {
                id: true,
                subject: true,
                title: true,
                order: true,
                moduleNumber: true,
                duration: true,
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

    /* ── Map qua sections[] ── */
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
      const totalSkipped =
        s.totalSkipped ??
        Math.max(totalQuestions - totalCorrect - totalWrong, 0);

      const answered = totalCorrect + totalWrong;
      const accuracy =
        answered > 0 ? Number(((totalCorrect / answered) * 100).toFixed(2)) : 0;

      const sectionStats = s.sections.map((sec) => {
        const total = sec.examSection.questions.length;
        const correct = sec.answers.filter((a) => a.isCorrect === true).length;
        const wrong = sec.answers.filter((a) => a.isCorrect === false).length;
        const secAnswered = correct + wrong;
        const unanswered = Math.max(total - secAnswered, 0);
        const acc =
          secAnswered > 0
            ? Number(((correct / secAnswered) * 100).toFixed(2))
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
          total,
          answered: secAnswered,
          unanswered,
          correct,
          wrong,
          accuracy: acc,
          timeSpent: sec.timeSpent,
          duration: sec.examSection.duration,
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
        totalQuestions,
        answered,
        unanswered: totalSkipped,
        correct: totalCorrect,
        incorrect: totalWrong,
        accuracy,
        rawScore: s.rawScore ?? totalCorrect,
        scaledScore: s.scaledScore ?? null,
        totalTimeSpent: s.timeSpent ?? 0,
        startedAt: s.startedAt,
        completedAt: s.completedAt,
        createdAt: s.createdAt,
        sections: sectionStats,
      };
    });

    return NextResponse.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error("[MathHistory] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch Math history",
      },
      { status: 500 },
    );
  }
}
