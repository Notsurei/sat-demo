"use server";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../util/prisma";

export async function POST(request: NextRequest) {
  try {
    // Lấy userId từ header hoặc session
    // const userId = request.headers.get("x-user-id");
    // if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const exams = await prisma.exam.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        version: true,
        duration: true,
        totalQuestions: true,
        createdAt: true,
        _count: {
          select: { sections: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: exams }, { status: 200 });
  } catch (error) {
    console.error("Error fetching exams:", error);
    return NextResponse.json(
      { message: "Failed to fetch exams" },
      { status: 500 }
    );
  }
}