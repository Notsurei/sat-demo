"use server";

import { NextRequest, NextResponse } from "next/server";
import { Prisma, Subject } from "@prisma/client";
import { prisma } from "@/app/api/util/prisma";

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
  displayOrder: [
    "craft and structure",
    "information and ideas",
    "standard english conventions",
    "expression of ideas",
  ] as readonly string[],
} as const;

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

type AdaptiveResult = {
  variant: "EASY" | "HARD";
  weightedPct: number;
  filledCount: number;
};

type NextSectionPayload = {
  id: string;
  sectionSessionId: string;
  examSectionId: string;
  moduleNumber: number;
  title: string;
  order: number;
  duration: number;
  durationSeconds: number;
  variant: string | null;
  questionCount: number;
};

interface TxResult {
  adaptive: AdaptiveResult | null;
  nextSectionPayload: NextSectionPayload | null;
  isLastModule: boolean;
}

function diffWeight(d: string | null | undefined): number {
  const s = (d || "medium").toLowerCase();
  if (s === "easy") return 1;
  if (s === "hard") return 3;
  return 2;
}

function nDom(v: string | null | undefined) {
  return (v || "").toLowerCase().trim();
}
function nSub(v: string | null | undefined) {
  return (v || "default").toLowerCase().trim();
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
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
      return Math.round(y0 + ((raw - x0) / (x1 - x0)) * (y1 - y0));
    }
  }
  return last[1];
}

function computeScaled(c: number, t: number, h: boolean): number {
  if (t === 0) return 200;
  const n = Math.round((c / t) * SAT_RW_MAX_RAW);
  const s = rawToScaled(n, h ? RW_SCALE_HARD : RW_SCALE_EASY);
  return Math.round(Math.max(200, Math.min(800, s)) / 10) * 10;
}

interface Stub {
  id: string;
  difficulty: string;
  domain: string | null;
  subtopic: string | null;
}

function selectByBlueprint(
  pool: Stub[],
  blueprint: Record<string, number>,
  targetCount: number,
): Stub[] {
  const subCounts: Record<string, number> = {};
  const selected: Stub[] = [];

  for (const [dom, targetPerDom] of Object.entries(blueprint)) {
    const domQs = shuffle(pool.filter((q) => nDom(q.domain) === dom));
    let added = 0;
    for (const q of domQs) {
      if (added >= targetPerDom) break;
      const sub = nSub(q.subtopic);
      if (!subCounts[sub]) subCounts[sub] = 0;
      if (
        subCounts[sub] < ADAPTIVE_CONFIG.maxPerSubtopic ||
        domQs.length <= targetPerDom
      ) {
        selected.push(q);
        subCounts[sub]++;
        added++;
      }
    }
  }

  if (selected.length < targetCount) {
    const used = new Set(selected.map((q) => q.id));
    const left = shuffle(pool.filter((q) => !used.has(q.id)));
    while (selected.length < targetCount && left.length > 0) {
      selected.push(left.shift()!);
    }
  }
  return selected.slice(0, targetCount);
}

/* RW sort: domain order → difficulty */
function sortRwForDisplay(qs: Stub[]): Stub[] {
  return [...qs].sort((a, b) => {
    let ia = ADAPTIVE_CONFIG.displayOrder.indexOf(nDom(a.domain) as any);
    let ib = ADAPTIVE_CONFIG.displayOrder.indexOf(nDom(b.domain) as any);
    if (ia === -1) ia = 99;
    if (ib === -1) ib = 99;
    if (ia !== ib) return ia - ib;
    return diffWeight(a.difficulty) - diffWeight(b.difficulty);
  });
}

async function fillAdaptiveM2Tx(params: {
  tx: Prisma.TransactionClient;
  examSectionId: string;
  variant: "EASY" | "HARD";
  usedQuestionIds: string[];
}): Promise<number> {
  const { tx, examSectionId, variant, usedQuestionIds } = params;
  const target = ADAPTIVE_CONFIG.questionsPerModule;

  const rawPool = await tx.question.findMany({
    where: {
      bankPurpose: { in: ["FULL_TEST", "MIXED"] },
      bankModule: { section: { subject: Subject.SAT_RW } },
      id: { notIn: usedQuestionIds },
    },
    select: { id: true, difficulty: true, domain: true, subtopic: true },
  });

  const pool: Stub[] = rawPool.map((q) => ({
    id: q.id,
    difficulty: (q.difficulty ?? "").trim().toUpperCase(),
    domain: q.domain,
    subtopic: q.subtopic,
  }));

  const allowed = variant === "HARD" ? ["MEDIUM", "HARD"] : ["EASY", "MEDIUM"];
  const filtered = pool.filter((q) => allowed.includes(q.difficulty));

  if (filtered.length === 0) {
    throw new Error(`[RW Adaptive] Empty pool for ${variant}`);
  }

  const primary = filtered.filter(
    (q) => q.difficulty === (variant === "HARD" ? "HARD" : "EASY"),
  );

  let selected = selectByBlueprint(primary, ADAPTIVE_CONFIG.blueprint, target);

  if (selected.length < target) {
    const used = new Set(selected.map((q) => q.id));
    const fallback = shuffle(filtered.filter((q) => !used.has(q.id)));
    const extra = selectByBlueprint(
      fallback,
      ADAPTIVE_CONFIG.blueprint,
      target - selected.length,
    );
    const seen = new Set(selected.map((q) => q.id));
    for (const q of extra) {
      if (selected.length >= target) break;
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

  return selected.length;
}

interface RouteContext {
  params: Promise<{ sectionId: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { sectionId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const clientTimeSpent =
      typeof body.timeSpent === "number" && body.timeSpent >= 0
        ? Math.floor(body.timeSpent)
        : undefined;

    const sectionSession = await prisma.rwModuleSectionSession.findFirst({
      where: { id: sectionId, rwModuleSession: { userId } },
      include: {
        rwModuleSession: true,
        examSection: {
          include: {
            questions: {
              orderBy: { order: "asc" },
              include: { question: { include: { options: true } } },
            },
          },
        },
        answers: true,
      },
    });

    if (!sectionSession) {
      return NextResponse.json(
        { success: false, message: "Section not found" },
        { status: 404 },
      );
    }

    const parent = sectionSession.rwModuleSession;

    if (parent.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { success: false, message: "Session no longer active" },
        { status: 400 },
      );
    }

    if (sectionSession.status === "COMPLETED") {
      return NextResponse.json({
        success: true,
        message: "Already completed",
        data: {
          sectionSessionId: sectionSession.id,
          examSectionId: sectionSession.examSectionId,
          status: "COMPLETED",
          adaptive: null,
          nextSection: null,
          isLastModule: sectionSession.examSection.moduleNumber === 2,
        },
      });
    }

    const examQuestions = sectionSession.examSection.questions;
    const totalQuestions = examQuestions.length;

    let answered = 0;
    let correct = 0;
    let earnedWeight = 0;
    let totalWeight = 0;

    const results = examQuestions
      .map((eq) => {
        const q = eq.question;
        const ans = sectionSession.answers.find((a) => a.questionId === q.id);
        if (!ans) return null;

        let isCorrect = false;
        if (q.type === "MCQ" && ans.selectedOptionId) {
          const opt = q.options.find((o) => o.id === ans.selectedOptionId);
          isCorrect = opt?.isCorrect === true;
        }
        if (q.type === "GRID_IN" && ans.textAnswer) {
          const exp = q.correctTextAnswer ?? q.correctAnswer ?? "";
          isCorrect =
            ans.textAnswer.trim().toLowerCase() === exp.trim().toLowerCase();
        }

        const wasAnswered =
          ans.selectedOptionId !== null ||
          (ans.textAnswer !== null && ans.textAnswer.trim() !== "");

        if (wasAnswered) answered++;
        if (isCorrect) correct++;

        const w = diffWeight(q.difficulty);
        totalWeight += w;
        if (isCorrect) earnedWeight += w;

        return { id: ans.id, isCorrect };
      })
      .filter((r): r is { id: string; isCorrect: boolean } => r !== null);

    const wrong = answered - correct;
    const skipped = totalQuestions - answered;
    const weightedPct = totalWeight > 0 ? earnedWeight / totalWeight : 0;
    const isM1 = sectionSession.examSection.moduleNumber === 1;
    const isHard = sectionSession.examSection.variant === "HARD";
    const scaled = computeScaled(
      correct,
      totalQuestions,
      isM1 ? false : isHard,
    );
    const now = new Date();
    const sectionTime =
      clientTimeSpent ??
      Math.max(
        Math.floor(
          (now.getTime() -
            (sectionSession.startedAt?.getTime() ?? now.getTime())) /
            1000,
        ),
        0,
      );

    if (results.length > 0) {
      await Promise.all(
        results.map((r) =>
          prisma.rwModuleAnswer.updateMany({
            where: {
              id: r.id,
              rwModuleSectionSessionId: sectionSession.id,
            },
            data: { isCorrect: r.isCorrect },
          }),
        ),
      );
    }

    const txResult: TxResult = await prisma.$transaction(
      async (tx): Promise<TxResult> => {
        let adaptive: AdaptiveResult | null = null;
        let nextSectionPayload: NextSectionPayload | null = null;
        let isLastModule = false;

        await tx.rwModuleSectionSession.update({
          where: { id: sectionSession.id },
          data: {
            status: "COMPLETED",
            completedAt: now,
            lastActivityAt: now,
            remainingTime: 0,
            timeSpent: sectionTime,
          },
        });

        if (isM1) {
          const variant: "EASY" | "HARD" =
            weightedPct >= ADAPTIVE_CONFIG.weightedThreshold ? "HARD" : "EASY";

          const m2 = await tx.rwModuleSectionSession.findFirst({
            where: {
              rwModuleSessionId: parent.id,
              examSection: { moduleNumber: 2 },
            },
            select: {
              id: true,
              examSectionId: true,
              examSection: { select: { duration: true } },
            },
          });

          if (!m2) throw new Error("M2 section session not found");

          const usedIds = sectionSession.examSection.questions.map(
            (q) => q.questionId,
          );

          const filled = await fillAdaptiveM2Tx({
            tx,
            examSectionId: m2.examSectionId,
            variant,
            usedQuestionIds: usedIds,
          });

          adaptive = {
            variant,
            weightedPct: Number(weightedPct.toFixed(4)),
            filledCount: filled,
          };

          await tx.rwModuleSectionSession.update({
            where: { id: m2.id },
            data: {
              status: "IN_PROGRESS",
              startedAt: now,
              lastActivityAt: now,
              remainingTime: m2.examSection.duration * 60,
            },
          });

          await tx.rwModuleSession.update({
            where: { id: parent.id },
            data: {
              currentSectionOrder: 2,
              lastActivityAt: now,
            },
          });

          const m2Full = await tx.examSection.findUnique({
            where: { id: m2.examSectionId },
            select: {
              id: true,
              title: true,
              order: true,
              duration: true,
              moduleNumber: true,
              variant: true,
              _count: { select: { questions: true } },
            },
          });

          if (m2Full) {
            nextSectionPayload = {
              id: m2Full.id,
              sectionSessionId: m2.id,
              examSectionId: m2Full.id,
              moduleNumber: m2Full.moduleNumber,
              title: m2Full.title,
              order: m2Full.order,
              duration: m2Full.duration,
              durationSeconds: m2Full.duration * 60,
              variant: m2Full.variant,
              questionCount: m2Full._count.questions,
            };
          }

          return { adaptive, nextSectionPayload, isLastModule };
        }

        /* M2 → aggregate + cộng dồn timeSpent */
        isLastModule = true;

        const allSections = await tx.rwModuleSectionSession.findMany({
          where: { rwModuleSessionId: parent.id },
          select: {
            timeSpent: true,
            examSection: {
              select: { questions: { select: { questionId: true } } },
            },
            answers: {
              select: {
                selectedOptionId: true,
                textAnswer: true,
                isCorrect: true,
              },
            },
          },
        });

        let totQ = 0;
        let totC = 0;
        let totW = 0;
        let totAns = 0;
        let totTime = 0;
        for (const s of allSections) {
          totQ += s.examSection.questions.length;
          totTime += s.timeSpent ?? 0;
          for (const a of s.answers) {
            const wasAnswered =
              a.selectedOptionId !== null ||
              (a.textAnswer !== null && a.textAnswer.trim() !== "");
            if (wasAnswered) totAns++;
            if (a.isCorrect === true) totC++;
            else if (a.isCorrect === false) totW++;
          }
        }

        const totSkip = Math.max(totQ - totAns, 0);

        await tx.rwModuleSession.update({
          where: { id: parent.id },
          data: {
            status: "COMPLETED",
            completedAt: now,
            lastActivityAt: now,
            totalCorrect: totC,
            totalWrong: totW,
            totalSkipped: totSkip,
            rawScore: totC,
            scaledScore: scaled,
            timeSpent: totTime,
          },
        });

        return { adaptive, nextSectionPayload, isLastModule };
      },
      { timeout: 20_000 },
    );

    return NextResponse.json({
      success: true,
      message: "Section completed",
      data: {
        sectionSessionId: sectionSession.id,
        examSectionId: sectionSession.examSectionId,
        section: {
          id: sectionSession.examSection.id,
          title: sectionSession.examSection.title,
          subject: sectionSession.examSection.subject,
          order: sectionSession.examSection.order,
          moduleNumber: sectionSession.examSection.moduleNumber,
        },
        status: "COMPLETED",
        result: {
          totalQuestions,
          answeredQuestions: answered,
          unansweredQuestions: skipped,
          correctAnswers: correct,
          incorrectAnswers: wrong,
          earnedWeight,
          totalWeight,
          weightedPct,
          scaledScore: scaled,
          timeSpent: sectionTime,
        },
        adaptive: txResult.adaptive,
        nextSection: txResult.nextSectionPayload,
        nextSectionId: txResult.nextSectionPayload?.sectionSessionId ?? null,
        isLastModule: txResult.isLastModule,
      },
    });
  } catch (error) {
    console.error("[RwComplete] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to complete section",
      },
      { status: 500 },
    );
  }
}
