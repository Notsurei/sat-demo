"use server";
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/app/api/util/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const attemptId = request.nextUrl.searchParams.get("attemptId");

    if (!attemptId) {
      return NextResponse.json(
        {
          message: "No completed attempts found",
        },
        {
          status: 404,
        },
      );
    }

    const attempt = await prisma.attempt.findFirst({
      where: {
        id: attemptId,
        examId: id,
        status: "DONE",
      },
      include: {
        answers: {
          include: {
            selectedOption: true,

            question: {
              include: {
                options: {
                  orderBy: {
                    label: "asc",
                  },
                },
              },
            },
          },
        },

        exam: true,
      },
    });

    if (!attempt) {
      return NextResponse.json(
        {
          error: "Attempt not found",
        },
        {
          status: 404,
        },
      );
    }

    const review = attempt.answers.map(
      (answer: {
        question: {
          id: string;
          prompt: string;
          type: string;
          difficulty: string;
          explanation: string | null;
          options: { id: string; label: string; content: string }[];
          correctAnswer: string | null;
          correctTextAnswer: string | null;
        };
        selectedOption: { label: string } | null;
        textAnswer: string | null;
        isCorrect: boolean | null;
      }) => ({
        questionId: answer.question.id,

        prompt: answer.question.prompt,

        type: answer.question.type,

        difficulty: answer.question.difficulty,

        explanation: answer.question.explanation,

        options: answer.question.options.map(
          (option: { id: any; label: any; content: any }) => ({
            id: option.id,
            label: option.label,
            content: option.content,
          }),
        ),

        userAnswer: answer.selectedOption?.label ?? answer.textAnswer ?? null,

        correctAnswer:
          answer.question.correctAnswer ?? answer.question.correctTextAnswer,

        isCorrect: answer.isCorrect,
      }),
    );

    return NextResponse.json(
      {
        attemptId: attempt.id,
        examId: attempt.examId,

        score: attempt.score,
        correctAnswers: attempt.correctAnswers,

        totalQuestions: attempt.exam.totalQuestions,

        submittedAt: attempt.submittedAt,

        review,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      {
        status: 500,
      },
    );
  }
}
