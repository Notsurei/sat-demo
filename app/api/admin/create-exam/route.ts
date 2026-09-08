"use server";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../util/prisma";
import { Subject } from "@prisma/client";
import { requireAdminOrVip } from "../../util/permission";
import { z } from "zod";

const CreateExamSchema = z.object({
  bankId: z.string().min(1),
  title: z.string().min(1),
  duration: z.number().positive(),
  subject: z.enum(["SAT_MATH", "SAT_RW"]),
  description: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreateExamSchema.parse(body);

    const role = request.headers.get("x-user-role");
    const plan = request.headers.get("x-user-plan");

    requireAdminOrVip(role, plan);

    const bank = await prisma.questionBank.findUnique({
      where: {
        id: parsed.bankId,
      },
      include: {
        sections: {
          include: {
            modules: {
              include: {
                questions: {
                  include: {
                    options: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!bank) {
      return NextResponse.json(
        {
          success: false,
          error: "Question bank not found",
        },
        {
          status: 404,
        },
      );
    }

    const totalQuestions = bank.sections.reduce(
      (sectionAcc: number, section: any) =>
        sectionAcc +
        section.modules.reduce(
          (moduleAcc: number, module: any) =>
            moduleAcc + module.questions.length,
          0,
        ),
      0,
    );

    const exam = await prisma.exam.create({
      data: {
        title: parsed.title,
        description: parsed.description,
        subject: parsed.subject as Subject,
        duration: parsed.duration,
        totalQuestions,
      },
    });

    for (const bankSection of bank.sections) {
      const section = await prisma.section.create({
        data: {
          title: bankSection.title ?? bankSection.key,
          order: bankSection.order,
          examId: exam.id,
        },
      });

      for (const module of bankSection.modules) {
        const group = await prisma.questionGroup.create({
          data: {
            title: module.title,
            passage: module.passage,
            imageUrl: module.imageUrl,
            audioUrl: module.audioUrl,
            order: module.order,
            sectionId: section.id,
          },
        });

        for (const question of module.questions) {
          await prisma.question.create({
            data: {
              externalId: question.externalId,
              prompt: question.prompt,
              domain: question.domain,
              subtopic: question.subtopic,
              difficulty: question.difficulty,
              type: question.type,
              correctAnswer: question.correctAnswer,
              correctTextAnswer: question.correctTextAnswer,
              explanation: question.explanation,
              order: question.order,

              groupId: group.id,

              options: {
                create: question.options.map((option: any) => ({
                  label: option.label,
                  content: option.content,
                  isCorrect: option.isCorrect,
                })),
              },
            },
          });
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        examId: exam.id,
        title: exam.title,
        totalQuestions,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      {
        status: 500,
      },
    );
  }
}
