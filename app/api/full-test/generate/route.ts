"use server";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/util/prisma";
import { headers } from "next/headers";
import { Subject } from "@prisma/client";
import {
  getFullTestLimit,
  isFullTestUnlimited,
  type PlanType,
} from "@/app/api/util/plan-limit";

const SAT_CONFIG = {
  RW: {
    moduleCount: 2,
    questionsPerModule: 27,
    duration: 32,
    blueprint: {
      "craft and structure": 7,
      "information and ideas": 7,
      "standard english conventions": 7,
      "expression of ideas": 6,
    },
    displayOrder: [
      "craft and structure",
      "information and ideas",
      "standard english conventions",
      "expression of ideas",
    ],
  },
  MATH: {
    moduleCount: 2,
    questionsPerModule: 22,
    duration: 35,
    blueprint: {
      algebra: 6,
      "advanced math": 6,
      "problem solving and data analysis": 5,
      geometry: 5,
    },
    displayOrder: null,
  },
  BREAK_DURATION: 10,
} as const;

const MAX_PER_SUBTOPIC = 2;

interface QuestionStub {
  id: string;
  difficulty: string;
  domain: string | null;
  subtopic: string | null;
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function normalizeDomain(value: string | null | undefined): string {
  return (value || "").trim().toLowerCase();
}

function normalizeSubtopic(value: string | null | undefined): string {
  return (value || "default").trim().toLowerCase();
}

function diffWeight(difficulty: string | null | undefined): number {
  const s = (difficulty || "medium").trim().toLowerCase();
  if (s === "easy") return 1;
  if (s === "hard") return 3;
  return 2;
}

function interleaveByDifficulty(qs: QuestionStub[]): QuestionStub[] {
  const easy = shuffle(qs.filter((q) => q.difficulty === "EASY"));
  const medium = shuffle(qs.filter((q) => q.difficulty === "MEDIUM"));
  const hard = shuffle(qs.filter((q) => q.difficulty === "HARD"));
  const other = shuffle(
    qs.filter((q) => !["EASY", "MEDIUM", "HARD"].includes(q.difficulty)),
  );

  const result: QuestionStub[] = [];
  while (easy.length || medium.length || hard.length || other.length) {
    if (easy.length) result.push(easy.shift()!);
    if (medium.length) result.push(medium.shift()!);
    if (hard.length) result.push(hard.shift()!);
    if (other.length) result.push(other.shift()!);
  }
  return result;
}

function selectByBlueprint(
  pool: QuestionStub[],
  blueprint: Record<string, number>,
  targetCount: number,
  balanceDifficulty = false,
): QuestionStub[] {
  const subtopicCounts: Record<string, number> = {};
  const selected: QuestionStub[] = [];

  for (const [dom, targetPerDom] of Object.entries(blueprint)) {
    const domQs = shuffle(
      pool.filter((q) => normalizeDomain(q.domain) === dom),
    );

    const ordered = balanceDifficulty ? interleaveByDifficulty(domQs) : domQs;

    let addedFromDom = 0;
    for (const q of ordered) {
      if (addedFromDom >= targetPerDom) break;

      const sub = normalizeSubtopic(q.subtopic);
      if (!subtopicCounts[sub]) subtopicCounts[sub] = 0;

      if (
        subtopicCounts[sub] < MAX_PER_SUBTOPIC ||
        domQs.length <= targetPerDom
      ) {
        selected.push(q);
        subtopicCounts[sub]++;
        addedFromDom++;
      }
    }
  }

  // Backfill
  if (selected.length < targetCount) {
    const usedIds = new Set(selected.map((q) => q.id));
    const leftovers = shuffle(pool.filter((q) => !usedIds.has(q.id)));
    while (selected.length < targetCount && leftovers.length > 0) {
      selected.push(leftovers.shift()!);
    }
  }

  return selected.slice(0, targetCount);
}

function sortForDisplay(
  questions: QuestionStub[],
  subject: "RW" | "MATH",
): QuestionStub[] {
  const arr = [...questions];

  if (subject === "RW") {
    const order = SAT_CONFIG.RW.displayOrder as readonly string[];
    arr.sort((a, b) => {
      let idxA = order.indexOf(normalizeDomain(a.domain));
      let idxB = order.indexOf(normalizeDomain(b.domain));
      if (idxA === -1) idxA = 99;
      if (idxB === -1) idxB = 99;
      if (idxA !== idxB) return idxA - idxB;
      return diffWeight(a.difficulty) - diffWeight(b.difficulty);
    });
  } else {
    arr.sort((a, b) => diffWeight(a.difficulty) - diffWeight(b.difficulty));
  }

  return arr;
}

function buildModule(
  pool: QuestionStub[],
  subject: "RW" | "MATH",
  targetCount: number,
): QuestionStub[] {
  const blueprint = SAT_CONFIG[subject].blueprint as Record<string, number>;
  const selected = selectByBlueprint(pool, blueprint, targetCount, true);
  return sortForDisplay(selected, subject);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    const title =
      typeof body.title === "string" && body.title.trim()
        ? body.title.trim()
        : `SAT Full Test ${Date.now()}`;

    const h = await headers();
    const userId = h.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionPlan: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    const plan = user.subscriptionPlan as PlanType;
    const limit = getFullTestLimit(plan);
    const unlimited = isFullTestUnlimited(plan);

    if (!unlimited) {
      const used = await prisma.fullTestSession.count({
        where: {
          userId,
          status: { in: ["IN_PROGRESS", "BREAK", "COMPLETED"] },
        },
      });

      if (used >= limit) {
        return NextResponse.json(
          {
            success: false,
            error:
              plan === "FREE"
                ? "Full test is not available on your plan. Please upgrade."
                : `You've reached your limit (${limit} attempts). Please upgrade for more.`,
            code: "QUOTA_EXCEEDED",
            data: { plan, limit, used },
          },
          { status: 403 },
        );
      }
    }

    const [rwPool, mathPool] = await Promise.all([
      prisma.question.findMany({
        where: {
          bankPurpose: { in: ["FULL_TEST", "MIXED"] },
          bankModule: { section: { subject: Subject.SAT_RW } },
        },
        select: {
          id: true,
          difficulty: true,
          domain: true,
          subtopic: true,
        },
      }),
      prisma.question.findMany({
        where: {
          bankPurpose: { in: ["FULL_TEST", "MIXED"] },
          bankModule: { section: { subject: Subject.SAT_MATH } },
        },
        select: {
          id: true,
          difficulty: true,
          domain: true,
          subtopic: true,
        },
      }),
    ]);

    const RW_REQUIRED = SAT_CONFIG.RW.questionsPerModule * 2;
    const MATH_REQUIRED = SAT_CONFIG.MATH.questionsPerModule * 2;

    if (rwPool.length < RW_REQUIRED) {
      return NextResponse.json(
        {
          success: false,
          error: `Not enough Reading & Writing questions. Required ≥${RW_REQUIRED}, available ${rwPool.length}.`,
          code: "NOT_ENOUGH_RW_QUESTIONS",
          data: { required: RW_REQUIRED, available: rwPool.length },
        },
        { status: 400 },
      );
    }

    if (mathPool.length < MATH_REQUIRED) {
      return NextResponse.json(
        {
          success: false,
          error: `Not enough Math questions. Required ≥${MATH_REQUIRED}, available ${mathPool.length}.`,
          code: "NOT_ENOUGH_MATH_QUESTIONS",
          data: { required: MATH_REQUIRED, available: mathPool.length },
        },
        { status: 400 },
      );
    }

    const rwM1 = buildModule(
      rwPool as QuestionStub[],
      "RW",
      SAT_CONFIG.RW.questionsPerModule,
    );

    const mathM1 = buildModule(
      mathPool as QuestionStub[],
      "MATH",
      SAT_CONFIG.MATH.questionsPerModule,
    );

    const TOTAL_QUESTIONS =
      SAT_CONFIG.RW.questionsPerModule * SAT_CONFIG.RW.moduleCount +
      SAT_CONFIG.MATH.questionsPerModule * SAT_CONFIG.MATH.moduleCount;

    const TOTAL_DURATION =
      SAT_CONFIG.RW.duration * SAT_CONFIG.RW.moduleCount +
      SAT_CONFIG.BREAK_DURATION +
      SAT_CONFIG.MATH.duration * SAT_CONFIG.MATH.moduleCount;

    const exam = await prisma.$transaction(
      async (tx) => {
        return tx.exam.create({
          data: {
            title,
            description: "Generated Digital SAT full test (adaptive)",
            version: "SAT26-ADAPTIVE",
            duration: TOTAL_DURATION,
            totalQuestions: TOTAL_QUESTIONS,

            sections: {
              create: [
                {
                  subject: Subject.SAT_RW,
                  title: "Reading and Writing — Module 1",
                  order: 1,
                  duration: SAT_CONFIG.RW.duration,
                  breakAfter: null,
                  moduleNumber: 1,
                  variant: null,
                  questions: {
                    create: rwM1.map((q, i) => ({
                      questionId: q.id,
                      order: i + 1,
                    })),
                  },
                },
                {
                  subject: Subject.SAT_RW,
                  title: "Reading and Writing — Module 2",
                  order: 2,
                  duration: SAT_CONFIG.RW.duration,
                  breakAfter: SAT_CONFIG.BREAK_DURATION,
                  moduleNumber: 2,
                  variant: null,
                  questions: { create: [] },
                },
                {
                  subject: Subject.SAT_MATH,
                  title: "Math — Module 1",
                  order: 3,
                  duration: SAT_CONFIG.MATH.duration,
                  breakAfter: null,
                  moduleNumber: 1,
                  variant: null,
                  questions: {
                    create: mathM1.map((q, i) => ({
                      questionId: q.id,
                      order: i + 1,
                    })),
                  },
                },
                {
                  subject: Subject.SAT_MATH,
                  title: "Math — Module 2",
                  order: 4,
                  duration: SAT_CONFIG.MATH.duration,
                  breakAfter: null,
                  moduleNumber: 2,
                  variant: null,
                  questions: { create: [] },
                },
              ],
            },
          },
          include: {
            sections: { orderBy: { order: "asc" } },
          },
        });
      },
      { maxWait: 10_000, timeout: 15_000 },
    );

    const sectionsPayload = exam.sections.map((s) => ({
      id: s.id,
      subject: s.subject,
      title: s.title,
      order: s.order,
      duration: s.duration,
      breakAfter: s.breakAfter,
      moduleNumber: s.moduleNumber,
      variant: s.variant,
      questionCount:
        s.subject === Subject.SAT_RW
          ? SAT_CONFIG.RW.questionsPerModule
          : SAT_CONFIG.MATH.questionsPerModule,
    }));

    return NextResponse.json(
      {
        success: true,
        examId: exam.id,
        data: {
          examId: exam.id,
          title: exam.title,
          totalQuestions: exam.totalQuestions,
          duration: exam.duration,
          sections: sectionsPayload,
        },
        title: exam.title,
        totalQuestions: exam.totalQuestions,
        duration: exam.duration,
        sections: sectionsPayload,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("GENERATE FULL TEST ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 },
    );
  }
}
