"use server";

import { NextResponse } from "next/server";
import { prisma } from "../util/prisma";

export async function GET() {
  try {
    const exams = await prisma.exam.findMany({
      where: {
        sections: {
          some: {
            subject: "SAT_MATH",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        description: true,
        version: true,
        duration: true,
        totalQuestions: true,
        createdAt: true,
        sections: {
          where: {
            subject: "SAT_MATH",
          },
          orderBy: {
            order: "asc",
          },
          select: {
            id: true,
            examId: true,
            subject: true,
            title: true,
            order: true,
            duration: true,
            breakAfter: true,
            moduleNumber: true,
            variant: true,
            _count: {
              select: {
                questions: true,
              },
            },
          },
        },
      },
    });

    const data = exams.map((exam) => ({
      ...exam,
      sections: exam.sections.map((section) => ({
        ...section,
        totalQuestions: section._count.questions,
        _count: undefined,
      })),
    }));

    return NextResponse.json(
      {
        success: true,
        data,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/math-modules error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch Math Modules",
      },
      { status: 500 },
    );
  }
}
