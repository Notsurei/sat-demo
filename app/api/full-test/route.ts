"use server";

import { NextResponse } from "next/server";
import { prisma } from "../util/prisma";

export async function GET() {
  try {
    const exams = await prisma.exam.findMany({
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
            _count: {
              select: {
                questions: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: exams,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/full-test error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch full tests",
      },
      { status: 500 },
    );
  }
}
