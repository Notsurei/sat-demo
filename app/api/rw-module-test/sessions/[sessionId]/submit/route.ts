"use server";

import { NextResponse } from "next/server";
import { prisma } from "../../../../util/prisma";
import { Subject } from "@prisma/client";

interface RouteContext {
  params: Promise<{ sessionId: string }>;
}

const ADAPTIVE_CONFIG = {
  questionsPerModule: 27,
  weightedThreshold: 0.58,
  maxPerSubtopic: 2,
  blueprint: {
    "craft and structure": 7,
    "information and ideas": 7,
    "standard english conventions": 7,
    "expression of ideas": 6,
  } as Record<string, number>,
} as const;

const RW_DISPLAY_ORDER = [
  "craft and structure",
  "information and ideas",
  "standard english conventions",
  "expression of ideas",
] as const;

const SAT_RW_MAX_RAW = 54;

const RW_SCALE_HARD: ReadonlyArray<readonly [number, number]> = [
  [0, 200],
  [3, 230],
  [6, 260],
  [9, 290],
  [12, 320],
  [15, 360],
  [18, 390],
  [21, 420],
  [24, 460],
  [27, 490],
  [30, 520],
  [33, 550],
  [36, 580],
  [39, 610],
  [42, 640],
  [44, 660],
  [46, 680],
  [48, 710],
  [50, 740],
  [52, 770],
  [53, 790],
  [54, 800],
];

const RW_SCALE_EASY: ReadonlyArray<readonly [number, number]> = [
  [0, 200],
  [3, 220],
  [6, 250],
  [9, 270],
  [12, 300],
  [15, 330],
  [18, 360],
  [21, 390],
  [24, 410],
  [27, 430],
  [30, 450],
  [33, 470],
  [36, 490],
  [39, 510],
  [42, 530],
  [44, 550],
  [46, 570],
  [48, 590],
  [50, 610],
  [52, 630],
  [54, 650],
];

function diffWeight(difficulty: string | null | undefined): number {
  const s = (difficulty || "medium").trim().toLowerCase();
  if (s === "easy") return 1;
  if (s === "hard") return 3;
  return 2;
}

function normalizeDomain(value: string | null | undefined): string {
  return (value || "").trim().toLowerCase();
}

function normalizeSubtopic(value: string | null | undefined): string {
  return (value || "default").trim().toLowerCase();
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function rawToScaled(
  raw: number,
  table: ReadonlyArray<readonly [number, number]>,
): number {
  if (raw <= table[0][0]) return table[0][1];
  const last = table[table.length - 1];
  if (raw >= last[0]) return last[1];

  for (let i = 1; i < table.length; i++) {
    if (raw <= table[i][0]) {
      const [x0, y0] = table[i - 1];
      const [x1, y1] = table[i];
      const t = (raw - x0) / (x1 - x0);
      return Math.round(y0 + t * (y1 - y0));
    }
  }
  return last[1];
}

function computeScaled(
  correct: number,
  total: number,
  isHard: boolean,
): number {
  if (total === 0) return 200;
  const normalizedRaw = Math.round((correct / total) * SAT_RW_MAX_RAW);
  const table = isHard ? RW_SCALE_HARD : RW_SCALE_EASY;
  const scaled = rawToScaled(normalizedRaw, table);
  const clamped = Math.max(200, Math.min(800, scaled));
  return Math.round(clamped / 10) * 10;
}

interface QuestionStub {
  id: string;
  difficulty: string;
  domain: string | null;
  subtopic: string | null;
}

function selectByBlueprint(
  pool: QuestionStub[],
  blueprint: Record<string, number>,
  targetCount: number,
): QuestionStub[] {
  const subtopicCounts: Record<string, number> = {};
  const selected: QuestionStub[] = [];

  for (const [dom, targetPerDom] of Object.entries(blueprint)) {
    const domQs = shuffle(
      pool.filter((q) => normalizeDomain(q.domain) === dom),
    );

    let addedFromDom = 0;
    for (const q of domQs) {
      if (addedFromDom >= targetPerDom) break;

      const sub = normalizeSubtopic(q.subtopic);
      if (!subtopicCounts[sub]) subtopicCounts[sub] = 0;

      if (
        subtopicCounts[sub] < ADAPTIVE_CONFIG.maxPerSubtopic ||
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
  return [...qs].sort((a, b) => {
    let idxA = RW_DISPLAY_ORDER.indexOf(
      normalizeDomain(a.domain) as (typeof RW_DISPLAY_ORDER)[number],
    );
    let idxB = RW_DISPLAY_ORDER.indexOf(
      normalizeDomain(b.domain) as (typeof RW_DISPLAY_ORDER)[number],
    );
    if (idxA === -1) idxA = 99;
    if (idxB === -1) idxB = 99;
    if (idxA !== idxB) return idxA - idxB;
    return diffWeight(a.difficulty) - diffWeight(b.difficulty);
  });
}

async function fillAdaptiveM2Tx(params: {
  tx: any;
  examSectionId: string;
  variant: "EASY" | "HARD";
  usedQuestionIds: string[];
}): Promise<number> {
  const { tx, examSectionId, variant, usedQuestionIds } = params;
  const targetCount = ADAPTIVE_CONFIG.questionsPerModule;

  const pool = (await tx.question.findMany({
    where: {
      bankPurpose: { in: ["FULL_TEST", "MIXED"] },
      bankModule: { section: { subject: Subject.SAT_RW } },
      id: { notIn: usedQuestionIds },
      difficulty:
        variant === "HARD"
          ? { in: ["MEDIUM", "HARD"] }
          : { in: ["EASY", "MEDIUM"] },
    },
    select: {
      id: true,
      difficulty: true,
      domain: true,
      subtopic: true,
    },
  })) as QuestionStub[];

  console.info("[RW Adaptive] Pool check", {
    variant,
    poolSize: pool.length,
    targetCount,
    hasEnough: pool.length >= targetCount,
    usedCount: usedQuestionIds.length,
  });

  if (pool.length === 0) {
    throw new Error(
      `[RW Adaptive] Empty pool for variant ${variant}. Check bankPurpose / bankModule filters.`,
    );
  }

  const primaryDifficulty = variant === "HARD" ? "HARD" : "EASY";
  const primaryPool = pool.filter((q) => q.difficulty === primaryDifficulty);

  let selected = selectByBlueprint(
    primaryPool as QuestionStub[],
    ADAPTIVE_CONFIG.blueprint,
    targetCount,
  );

  if (selected.length < targetCount) {
    const usedIds = new Set(selected.map((q) => q.id));
    const fallbackPool = shuffle(
      pool.filter((q) => !usedIds.has(q.id)),
    ) as QuestionStub[];

    const extra = selectByBlueprint(
      fallbackPool,
      ADAPTIVE_CONFIG.blueprint,
      targetCount - selected.length,
    );

    const seen = new Set(selected.map((q) => q.id));
    for (const q of extra) {
      if (selected.length >= targetCount) break;
      if (seen.has(q.id)) continue;
      selected.push(q);
      seen.add(q.id);
    }
  }

  selected = sortRwForDisplay(selected);

  await tx.examQuestion.deleteMany({ where: { examSectionId } });

  if (selected.length > 0) {
    await tx.examQuestion.createMany({
      data: selected.map((q, i) => ({
        examSectionId,
        questionId: q.id,
        order: i + 1,
      })),
    });
  }

  await tx.examSection.update({
    where: { id: examSectionId },
    data: { variant },
  });

  console.info("[RW Adaptive] Fill result", {
    examSectionId,
    variant,
    requestedCount: targetCount,
    filledCount: selected.length,
    isShort: selected.length < targetCount,
  });

  return selected.length;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { sessionId } = await context.params;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, message: "Session ID is required" },
        { status: 400 },
      );
    }

    // ✅ FIX: Query RwModuleSectionSession (không phải RwModuleSession)
    // sessionId trong URL là RwModuleSectionSession.id
    const sectionSession = await prisma.rwModuleSectionSession.findFirst({
      where: {
        id: sessionId,
        rwModuleSession: { userId }, // verify ownership qua parent
      },
      select: {
        id: true,
        status: true,
        startedAt: true,
        completedAt: true,
        examSectionId: true, // ✅ có trên RwModuleSectionSession

        examSection: {
          select: {
            id: true,
            examId: true,
            subject: true,
            order: true,
            duration: true,
            moduleNumber: true,
            variant: true,
            title: true,

            questions: {
              select: {
                questionId: true,
                question: {
                  select: {
                    id: true,
                    difficulty: true,
                  },
                },
              },
            },
          },
        },

        answers: {
          // ✅ có trên RwModuleSectionSession
          select: {
            questionId: true,
            selectedOptionId: true,
            textAnswer: true,
            isCorrect: true,
          },
        },

        rwModuleSession: {
          select: {
            id: true,
            userId: true,
            examId: true,
            status: true,
            startedAt: true,
            completedAt: true,
            currentSectionOrder: true,
          },
        },
      },
    });

    if (!sectionSession) {
      return NextResponse.json(
        { success: false, message: "Session not found" },
        { status: 404 },
      );
    }

    if (sectionSession.examSection.subject !== Subject.SAT_RW) {
      return NextResponse.json(
        {
          success: false,
          message: "This session is not an RW module session",
        },
        { status: 400 },
      );
    }

    if (sectionSession.status === "COMPLETED") {
      return NextResponse.json(
        { success: false, message: "This module has already been submitted" },
        { status: 409 },
      );
    }

    if (sectionSession.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { success: false, message: "This session cannot be submitted" },
        { status: 409 },
      );
    }

    const allAnswers = sectionSession.answers;
    const totalQuestions = sectionSession.examSection.questions.length;

    const answeredAnswers = allAnswers.filter(
      (a) =>
        a.selectedOptionId !== null ||
        (a.textAnswer !== null && a.textAnswer.trim() !== ""),
    );

    const correctAnswers = allAnswers.filter(
      (a) => a.isCorrect === true,
    ).length;

    const wrongAnswers = allAnswers.filter((a) => a.isCorrect === false).length;

    const skippedAnswers = Math.max(totalQuestions - answeredAnswers.length, 0);

    const rawScore = correctAnswers;

    const now = new Date();
    const startMs = sectionSession.startedAt?.getTime() ?? now.getTime();
    const timeSpent = Math.max(Math.floor((now.getTime() - startMs) / 1000), 0);

    const isM1 = sectionSession.examSection.moduleNumber === 1;

    const currentVariantIsHard =
      sectionSession.examSection.variant === "HARD" ||
      sectionSession.examSection.title.toLowerCase().includes("hard");

    const scaledScore = computeScaled(
      correctAnswers,
      totalQuestions,
      isM1 ? false : currentVariantIsHard,
    );

    let weightedPct = 0;
    if (isM1 && totalQuestions > 0) {
      let earned = 0;
      let total = 0;

      sectionSession.examSection.questions.forEach((eq) => {
        const answer = allAnswers.find((a) => a.questionId === eq.questionId);
        if (!answer) return;

        const w = diffWeight(eq.question.difficulty);
        total += w;
        if (answer.isCorrect === true) earned += w;
      });

      weightedPct = total > 0 ? earned / total : 0;
    }

    const transactionResult = await prisma.$transaction(
      async (tx) => {
        // ✅ Update section session, không phải module session
        const updatedSection = await tx.rwModuleSectionSession.update({
          where: { id: sectionSession.id },
          data: {
            status: "COMPLETED",
            completedAt: now,
            timeSpent,
          },
        });

        // ✅ Update parent module session
        // scaledScore/rawScore tạm lưu trên parent (vì section không có field score)
        const parentUpdate: Record<string, unknown> = {
          scaledScore,
          rawScore,
          totalCorrect: correctAnswers,
          totalWrong: wrongAnswers,
          totalSkipped: skippedAnswers,
          lastActivityAt: now,
        };

        if (!isM1) {
          // M2 xong → module COMPLETED
          parentUpdate.status = "COMPLETED";
          parentUpdate.completedAt = now;
        } else {
          // M1 xong → chuyển sang M2
          parentUpdate.currentSectionOrder = 2;
        }

        await tx.rwModuleSession.update({
          where: { id: sectionSession.rwModuleSession.id },
          data: parentUpdate,
        });

        if (!isM1) {
          return { section: updatedSection, adaptive: null };
        }

        // Adaptive: fill M2
        const variant: "EASY" | "HARD" =
          weightedPct >= ADAPTIVE_CONFIG.weightedThreshold ? "HARD" : "EASY";

        let m2Section = await tx.examSection.findFirst({
          where: {
            examId: sectionSession.examSection.examId,
            subject: Subject.SAT_RW,
            moduleNumber: 2,
          },
          select: { id: true },
        });

        if (!m2Section) {
          m2Section = await tx.examSection.findFirst({
            where: {
              examId: sectionSession.examSection.examId,
              subject: Subject.SAT_RW,
              order: { gt: sectionSession.examSection.order },
            },
            orderBy: { order: "asc" },
            select: { id: true },
          });
          console.warn("[RW Adaptive] M2 found via order fallback");
        }

        if (!m2Section) {
          throw new Error(
            `M2 section not found for exam ${sectionSession.examSection.examId}. Generate route có tạo M2 không?`,
          );
        }

        const usedQuestionIds = sectionSession.examSection.questions.map(
          (q) => q.questionId,
        );

        const filledCount = await fillAdaptiveM2Tx({
          tx,
          examSectionId: m2Section.id,
          variant,
          usedQuestionIds,
        });

        console.info("[RW Adaptive] M2 filled successfully", {
          variant,
          weightedPct: weightedPct.toFixed(4),
          filledCount,
          expected: ADAPTIVE_CONFIG.questionsPerModule,
          m2SectionId: m2Section.id,
        });

        return {
          section: updatedSection,
          adaptive: {
            variant,
            weightedPct: Number(weightedPct.toFixed(4)),
            filledCount,
            nextSectionId: m2Section.id,
          },
        };
      },
      { maxWait: 10_000, timeout: 20_000 },
    );

    const completedSection = transactionResult.section;
    const adaptive = transactionResult.adaptive;

    return NextResponse.json(
      {
        success: true,
        message: "RW module submitted successfully",

        data: {
          // ✅ sessionId giờ là parent id, sectionSessionId là của section
          sessionId: sectionSession.rwModuleSession.id,
          sectionSessionId: completedSection.id,

          examId: sectionSession.examSection.examId,
          examSectionId: sectionSession.examSectionId,
          status: completedSection.status,

          moduleNumber: sectionSession.examSection.moduleNumber,
          isLastModule: !isM1,

          summary: {
            totalQuestions,
            answeredQuestions: answeredAnswers.length,
            correctAnswers,
            wrongAnswers,
            skippedAnswers,
            accuracy:
              answeredAnswers.length > 0
                ? Number(
                    ((correctAnswers / answeredAnswers.length) * 100).toFixed(
                      2,
                    ),
                  )
                : 0,
            rawScore,
            scaledScore,

            totalTimeSpent: timeSpent,
            startedAt: sectionSession.startedAt,
            completedAt: completedSection.completedAt,
          },

          adaptive,
          nextSectionId: adaptive?.nextSectionId ?? null,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("POST /api/rw-module/[sessionId]/submit error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to submit RW module",
      },
      { status: 500 },
    );
  }
}
