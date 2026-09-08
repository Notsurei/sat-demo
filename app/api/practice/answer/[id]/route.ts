"use server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/util/prisma";

export async function POST(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const { id } = await params;

    const body = await request.json();

    const { questionId, selectedOptionId, textAnswer } = body;

    const question = await prisma.question.findUnique({
      where: {
        id: questionId,
      },
    });

    if (!question) {
      return NextResponse.json(
        {
          error: "Question not found",
        },
        {
          status: 404,
        },
      );
    }

    let isCorrect = false;

    if (question.type === "MCQ") {
      const option = await prisma.option.findUnique({
        where: {
          id: selectedOptionId,
        },
      });

      isCorrect = option?.isCorrect ?? false;
    }

    if (question.type === "GRID_IN") {
      isCorrect = textAnswer?.trim() === question.correctTextAnswer;
    }

    const answer = await prisma.practiceAnswer.upsert({
      where: {
        practiceId_questionId: {
          practiceId: id,
          questionId,
        },
      },
      create: {
        practiceId: id,
        questionId,
        selectedOptionId,
        textAnswer,
        isCorrect,
      },
      update: {
        selectedOptionId,
        textAnswer,
        isCorrect,
      },
    });

    return NextResponse.json({
      success: true,
      answer,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed",
      },
      {
        status: 500,
      },
    );
  }
}
