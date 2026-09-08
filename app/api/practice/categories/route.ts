"use server";
import { NextResponse } from "next/server";
import { prisma } from "../../util/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get("subject");

    if (!subject) {
      return NextResponse.json(
        {
          success: false,
          error: "Subject is required",
        },
        { status: 400 },
      );
    }

    const questions = await prisma.question.findMany({
      where: {
        bankModule: {
          section: {
            subject: subject as "SAT_RW" | "SAT_MATH",
          },
        },
      },
      select: {
        domain: true,
        subtopic: true,
      },
      distinct: ["domain", "subtopic"],
      orderBy: [{ domain: "asc" }, { subtopic: "asc" }],
    });

    const categories: Record<string, string[]> = {};

    for (const question of questions) {
      const { domain, subtopic } = question;

      if (!domain) continue;

      if (!categories[domain]) {
        categories[domain] = [];
      }

      if (subtopic && !categories[domain].includes(subtopic)) {
        categories[domain].push(subtopic);
      }
    }

    return NextResponse.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error("GET /api/practice/categories error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load practice categories",
      },
      { status: 500 },
    );
  }
}
