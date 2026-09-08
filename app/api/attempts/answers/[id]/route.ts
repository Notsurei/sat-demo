"use server";
import { NextResponse } from "next/server";
import { prisma } from "../../../util/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const attempt = await prisma.attempt.findUnique({
      where: {
        id,
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

    const answers = await prisma.userAnswer.findMany({
      where: {
        attemptId: id,
      },
      include: {
        question: {
          include: {
            options: true,
          },
        },
        selectedOption: true,
      },
      orderBy: {
        question: {
          order: "asc",
        },
      },
    });

    return NextResponse.json(
      {
        attemptId: id,
        totalAnswers: answers.length,
        answers,
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
