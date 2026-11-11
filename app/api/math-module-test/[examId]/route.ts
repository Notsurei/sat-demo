"use server";

import { NextResponse } from "next/server";
import { prisma } from "../../util/prisma";
import { Subject } from "@prisma/client";

interface RouteContext {
  params: Promise<{
    examId: string;
  }>;
}

const MATH_SUBJECTS: Subject[] = [Subject.SAT_MATH, Subject.SAT_PRECALCULUS];

export async function GET(request: Request, context: RouteContext) {
  try {
    const { examId } = await context.params;

    if (!examId) {
      return NextResponse.json(
        { success: false, message: "Exam ID is required" },
        { status: 400 },
      );
    }

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      select: {
        id: true,
        title: true,
        description: true,
        version: true,
        duration: true,
        totalQuestions: true,
        sections: {
          where: {
            subject: { in: MATH_SUBJECTS },
          },
          orderBy: { order: "asc" },
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
                      orderBy: { label: "asc" },
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
        { success: false, message: "Exam not found" },
        { status: 404 },
      );
    }

    if (exam.sections.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "This exam has no math sections",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: exam.id,
          title: exam.title,
          description: exam.description,
          version: exam.version,
          duration: exam.duration,
          totalQuestions: exam.totalQuestions,

          mathSectionCount: exam.sections.length,
          mathQuestionCount: exam.sections.reduce(
            (sum, s) => sum + s.questions.length,
            0,
          ),

          sections: exam.sections,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/math-module/[examId] error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch math module" },
      { status: 500 },
    );
  }
}
