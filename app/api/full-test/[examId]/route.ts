"use server";
import { NextResponse } from "next/server";
import { prisma } from "../../util/prisma";

interface RouteContext {
  params: Promise<{
    examId: string;
  }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { examId } = await context.params;

    if (!examId) {
      return NextResponse.json(
        {
          success: false,
          message: "Exam ID is required",
        },
        { status: 400 },
      );
    }

    const exam = await prisma.exam.findUnique({
      where: {
        id: examId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        version: true,
        duration: true,
        totalQuestions: true,
        sections: {
          orderBy: {
            order: "asc",
          },
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
      },
    });

    if (!exam) {
      return NextResponse.json(
        {
          success: false,
          message: "Exam not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: exam,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/full-test/[examId] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch full test",
      },
      { status: 500 },
    );
  }
}
