"use server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/util/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string }> },
) {
  try {
    const { practiceId } = await params;

    const practice = await prisma.practice.findUnique({
      where: {
        id: practiceId,
      },
    });

    if (!practice) {
      return NextResponse.json(
        {
          success: false,
          error: "Practice not found",
        },
        {
          status: 404,
        },
      );
    }

    const practiceAnswers = await prisma.practiceAnswer.findMany({
      where: {
        practiceId,
      },
      include: {
        question: {
          include: {
            options: true,
          },
        },
      },
    });

    practiceAnswers.sort(
      (a, b) => a.question.order - b.question.order,
    );

    const mappedAnswers = Object.fromEntries(
      practiceAnswers.map((answer) => [
        answer.questionId,
        {
          optionId: answer.selectedOptionId ?? undefined,
          textAnswer: answer.textAnswer ?? undefined,
        },
      ]),
    );

    return NextResponse.json({
      success: true,
      practiceId: practice.id,
      // 👇 THÊM 3 DÒNG NÀY
      subject: practice.subject,
      domain: practice.domain,     // hoặc category nếu model dùng tên đó
      subtopic: practice.subtopic,
      currentQuestion: practice.answeredQuestions,
      questions: practiceAnswers.map((practiceAnswer) => {
        const q = practiceAnswer.question;

        const correctOption = q.options.find(
          (option) => option.isCorrect,
        );

        return {
          id: q.id,
          prompt: q.prompt,
          type: q.type,
          passage: q.passage,
          hint: q.explanation,
          explanation: q.explanation,
          options: q.options.map((option) => ({
            id: option.id,
            label: option.label,
            content: option.content,
          })),
          correctOptionId: correctOption?.id,
          correctAnswer:
            q.correctAnswer ??
            correctOption?.label ??
            undefined,
          correctTextAnswer:
            q.correctTextAnswer ?? undefined,
          difficulty: q.difficulty,
          domain: q.domain,
          subtopic: q.subtopic,
        };
      }),
      answers: mappedAnswers,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Internal server error",
      },
      {
        status: 500,
      },
    );
  }
}