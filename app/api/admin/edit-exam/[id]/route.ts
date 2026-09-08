"use server";

import { NextResponse } from "next/server";
import { prisma } from "@/app/api/util/prisma";
import { requireAdminOrVip } from "@/app/api/util/permission";
import { z } from "zod";

const UpdateExamSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  duration: z.number().positive().optional(),
  subject: z.enum(["SAT_MATH", "SAT_RW"]).optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const body = await request.json();

    const data = UpdateExamSchema.parse(body);
    const role = request.headers.get("x-user-role");
    const plan = request.headers.get("x-user-plan");
    requireAdminOrVip(role, plan);

    const existingExam = await prisma.exam.findUnique({
      where: {
        id,
      },
    });

    if (!existingExam) {
      return NextResponse.json(
        {
          success: false,
          error: "Exam not found",
        },
        {
          status: 404,
        },
      );
    }

    const updatedExam = await prisma.exam.update({
      where: {
        id,
      },
      data,
    });

    return NextResponse.json(
      {
        success: true,
        exam: updatedExam,
      },
      {
        status: 200,
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
