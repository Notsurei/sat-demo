"use server";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/util/prisma";
import { headers } from "next/headers";
import { PracticeMode, Subject } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { subject, domain, subtopic, questionCount = 10, mode } = body;

    const h = await headers();

    const userId = h.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }


    const count = Number(questionCount);

    if (!Number.isInteger(count) || count <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "questionCount must be a positive integer",
        },
        {
          status: 400,
        },
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },

      select: {
        subscriptionPlan: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        {
          status: 404,
        },
      );
    }


    const where: any = {};

    if (subject) {
      where.bankModule = {
        section: {
          subject: subject as Subject,
        },
      };
    }
    if (domain) {
      if (Array.isArray(domain)) {
        if (domain.length > 0) {
          where.domain = {
            in: domain,
          };
        }
      } else {
        where.domain = domain;
      }
    }

    if (subtopic) {
      if (Array.isArray(subtopic)) {
        if (subtopic.length > 0) {
          where.subtopic = {
            in: subtopic,
          };
        }
      } else {
        where.subtopic = subtopic;
      }
    }

    if (mode) {
      if (Array.isArray(mode)) {
        const validDifficulties = mode.filter((item) =>
          ["EASY", "MEDIUM", "HARD"].includes(item),
        );

        if (validDifficulties.length > 0) {
          where.difficulty = {
            in: validDifficulties,
          };
        }
      } else if (
        mode !== "ALL_LEVEL" &&
        ["EASY", "MEDIUM", "HARD"].includes(mode)
      ) {
        where.difficulty = mode;
      }
    }

    const totalMatchingQuestions = await prisma.question.count({
      where,
    });

    if (totalMatchingQuestions === 0) {
      return NextResponse.json(
        {
          success: false,

          error: "No questions found matching the selected criteria.",

          code: "NO_QUESTIONS",
        },
        {
          status: 404,
        },
      );
    }

    if (totalMatchingQuestions < count) {
      return NextResponse.json(
        {
          success: false,

          error: `Only ${totalMatchingQuestions} questions are available for the selected criteria.`,

          availableQuestions: totalMatchingQuestions,

          requestedQuestions: count,

          code: "NOT_ENOUGH_QUESTIONS",
        },
        {
          status: 400,
        },
      );
    }

    let candidates = await prisma.question.findMany({
      where: {
        ...where,

        smartMemories: {
          none: {
            userId,
          },
        },
      },

      include: {
        options: true,
      },
    });
    let smartMemoryReset = false;

    if (candidates.length < count) {
      const matchingQuestions = await prisma.question.findMany({
        where,

        select: {
          id: true,
        },
      });

      const questionIds = matchingQuestions.map((question) => question.id);
      await prisma.smartMemory.deleteMany({
        where: {
          userId,

          questionId: {
            in: questionIds,
          },
        },
      });

      smartMemoryReset = true;

      candidates = await prisma.question.findMany({
        where,

        include: {
          options: true,
        },
      });
    }

    const shuffled = [...candidates].sort(() => Math.random() - 0.5);

    const selectedQuestions = shuffled.slice(0, count);

    let modeToSave: PracticeMode = PracticeMode.ALL_LEVEL;

    if (Array.isArray(mode)) {
      const validModes = mode.filter((item) =>
        ["EASY", "MEDIUM", "HARD"].includes(item),
      );

      if (validModes.length === 1) {
        modeToSave = validModes[0] as PracticeMode;
      } else {
        modeToSave = PracticeMode.ALL_LEVEL;
      }
    } else if (mode === "EASY" || mode === "MEDIUM" || mode === "HARD") {
      modeToSave = mode as PracticeMode;
    }

    const practice = await prisma.practice.create({
      data: {
        userId,

        subject: subject as Subject,

        domain: Array.isArray(domain) ? domain.join(",") : domain || null,

        subtopic: Array.isArray(subtopic)
          ? subtopic.join(",")
          : subtopic || null,

        totalQuestions: selectedQuestions.length,

        mode: modeToSave as PracticeMode,
      },
    });

    // ========================================
    // CREATE PRACTICE ANSWERS
    // ========================================

    await prisma.practiceAnswer.createMany({
      data: selectedQuestions.map((question) => ({
        practiceId: practice.id,

        questionId: question.id,

        isCorrect: false,

        timeSpent: 0,
      })),

      skipDuplicates: true,
    });

    // ========================================
    // SAVE SMART MEMORY
    // ========================================

    await prisma.smartMemory.createMany({
      data: selectedQuestions.map((question) => ({
        userId,

        questionId: question.id,
      })),

      skipDuplicates: true,
    });


    if (user.subscriptionPlan === "FREE") {
      const allPractices = await prisma.practice.findMany({
        where: {
          userId,
        },

        orderBy: {
          startedAt: "desc",
        },

        select: {
          id: true,
        },
      });

      if (allPractices.length > 5) {
        const toDelete = allPractices.slice(5).map((practice) => practice.id);

        await prisma.practice.deleteMany({
          where: {
            id: {
              in: toDelete,
            },
          },
        });
      }
    }

    return NextResponse.json({
      success: true,

      practiceId: practice.id,

      totalQuestions: selectedQuestions.length,

      questions: selectedQuestions,

      smartMemoryReset,
    });
  } catch (error) {
    console.error("Create practice error:", error);

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
