"use server";

import { NextRequest, NextResponse } from "next/server";
import { Subject } from "@prisma/client";

import { prisma } from "@/app/api/util/prisma";
import {
  getRwTestLimit,
  isRwTestUnlimited,
  type PlanType,
} from "@/app/api/util/plan-limit";
import { resolveUserSubscription } from "@/app/api/util/subscription";

const RW_CONFIG = {
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
} as const;

const MAX_PER_SUBTOPIC = 2;

interface QuestionStub {
  id: string;
  difficulty: string;
  domain: string | null;
  subtopic: string | null;
}

function getMonthStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
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

  if (selected.length < targetCount) {
    const usedIds = new Set(selected.map((q) => q.id));
    const leftovers = shuffle(pool.filter((q) => !usedIds.has(q.id)));
    while (selected.length < targetCount && leftovers.length > 0) {
      selected.push(leftovers.shift()!);
    }
  }

  return selected.slice(0, targetCount);
}

function sortRwForDisplay(qs: QuestionStub[]): QuestionStub[] {
  const order = RW_CONFIG.displayOrder as readonly string[];

  return [...qs].sort((a, b) => {
    let idxA = order.indexOf(normalizeDomain(a.domain));
    let idxB = order.indexOf(normalizeDomain(b.domain));
    if (idxA === -1) idxA = 99;
    if (idxB === -1) idxB = 99;
    if (idxA !== idxB) return idxA - idxB;
    return diffWeight(a.difficulty) - diffWeight(b.difficulty);
  });
}

function buildRwModule(
  pool: QuestionStub[],
  targetCount: number,
): QuestionStub[] {
  const blueprint = RW_CONFIG.blueprint as Record<string, number>;
  const selected = selectByBlueprint(pool, blueprint, targetCount, true);
  return sortRwForDisplay(selected);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    const title =
      typeof body.title === "string" && body.title.trim()
        ? body.title.trim()
        : `SAT RW Module ${Date.now()}`;

    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const sub = await resolveUserSubscription(userId);
    const plan = sub.plan as PlanType;
    const limit = getRwTestLimit(plan);
    const unlimited = isRwTestUnlimited(plan);

    if (!unlimited) {
      const rwSessions = await prisma.rwModuleSession.findMany({
        where: {
          userId,
          status: { in: ["IN_PROGRESS", "COMPLETED", "EXPIRED"] },
          createdAt: { gte: getMonthStart() },
        },
        select: {
          examSection: { select: { examId: true } },
        },
      });

      const distinctExamIds = new Set(
        rwSessions.map((s) => s.examSection.examId),
      );
      const used = distinctExamIds.size;

      if (used >= limit) {
        return NextResponse.json(
          {
            success: false,
            code: "QUOTA_EXCEEDED",
            error:
              plan === "FREE"
                ? "RW module is not available on your plan. Please upgrade."
                : `You've reached your limit (${limit} attempts this month). Please upgrade for more.`,
            message:
              plan === "FREE"
                ? "Upgrade your plan to unlock RW modules."
                : `You've used ${used}/${limit} RW modules this month. Upgrade for more attempts.`,
            data: { plan, limit, used, remaining: 0 },
          },
          { status: 403 },
        );
      }
    }

    const rwPool = await prisma.question.findMany({
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
    });

    const RW_REQUIRED = RW_CONFIG.questionsPerModule * 2;

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

    const rwM1 = buildRwModule(
      rwPool as QuestionStub[],
      RW_CONFIG.questionsPerModule,
    );

    const TOTAL_QUESTIONS =
      RW_CONFIG.questionsPerModule * RW_CONFIG.moduleCount;

    const TOTAL_DURATION = RW_CONFIG.duration * RW_CONFIG.moduleCount;

    const exam = await prisma.$transaction(
      async (tx) => {
        return tx.exam.create({
          data: {
            title,
            description: "Generated Digital SAT RW module (adaptive)",
            version: "SAT26-RW-ADAPTIVE",
            duration: TOTAL_DURATION,
            totalQuestions: TOTAL_QUESTIONS,

            sections: {
              create: [
                {
                  subject: Subject.SAT_RW,
                  title: "Reading and Writing — Module 1",
                  order: 1,
                  duration: RW_CONFIG.duration,
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
                  duration: RW_CONFIG.duration,
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
      moduleNumber: s.moduleNumber,
      variant: s.variant,
      questionCount: s.moduleNumber === 1 ? RW_CONFIG.questionsPerModule : 0,
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
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[GenerateRwModule] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 },
    );
  }
}
