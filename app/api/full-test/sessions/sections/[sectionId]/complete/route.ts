"use server";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../util/prisma";
import jwt from "jsonwebtoken";
import { Subject } from "@prisma/client";

type Params = {
  params: Promise<{ sectionId: string }>;
};

interface JwtPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

const ADAPTIVE_CONFIG = {
  SAT_RW: {
    questionsPerModule: 27,
    module2Duration: 32,
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
  SAT_MATH: {
    questionsPerModule: 22,
    module2Duration: 35,
    blueprint: {
      algebra: 6,
      "advanced math": 6,
      "problem solving and data analysis": 5,
      geometry: 5,
    },
    displayOrder: null,
  },
  WEIGHTED_THRESHOLD: 0.58,
  MAX_PER_SUBTOPIC: 2,
} as const;

/* ─────────────────────────────────────────────────────────────
   SAT SCALING TABLES
   ───────────────────────────────────────────────────────────── */
const SAT_RW_MAX_RAW = 54;
const SAT_MATH_MAX_RAW = 44;

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

const MATH_SCALE_HARD: ReadonlyArray<readonly [number, number]> = [
  [0, 200],
  [2, 230],
  [4, 260],
  [6, 290],
  [8, 320],
  [10, 350],
  [12, 380],
  [14, 410],
  [16, 440],
  [18, 470],
  [20, 500],
  [22, 530],
  [24, 560],
  [26, 590],
  [28, 620],
  [30, 650],
  [32, 680],
  [34, 710],
  [36, 740],
  [38, 760],
  [40, 780],
  [42, 790],
  [43, 795],
  [44, 800],
];

const MATH_SCALE_EASY: ReadonlyArray<readonly [number, number]> = [
  [0, 200],
  [2, 220],
  [4, 240],
  [6, 260],
  [8, 280],
  [10, 300],
  [12, 325],
  [14, 350],
  [16, 375],
  [18, 400],
  [20, 420],
  [22, 445],
  [24, 465],
  [26, 480],
  [28, 500],
  [30, 515],
  [32, 530],
  [34, 545],
  [36, 560],
  [38, 575],
  [40, 590],
  [42, 610],
  [44, 630],
];

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

function computeSubjectScaled(
  subject: "RW" | "MATH",
  correct: number,
  total: number,
  isHard: boolean,
): number {
  if (total === 0) return 200;

  const maxRaw = subject === "RW" ? SAT_RW_MAX_RAW : SAT_MATH_MAX_RAW;
  const normalizedRaw =
    total === maxRaw ? correct : Math.round((correct / total) * maxRaw);

  const table =
    subject === "RW"
      ? isHard
        ? RW_SCALE_HARD
        : RW_SCALE_EASY
      : isHard
        ? MATH_SCALE_HARD
        : MATH_SCALE_EASY;

  const scaled = rawToScaled(normalizedRaw, table);
  return Math.round(Math.max(200, Math.min(800, scaled)) / 10) * 10;
}

interface QuestionStub {
  id: string;
  difficulty: string;
  domain: string | null;
  subtopic: string | null;
}

/* ─────────────────────────────────────────────────────────────
   AUTH
   ───────────────────────────────────────────────────────────── */
function getUserIdFromRequest(req: NextRequest): string | null {
  const headerUserId = req.headers.get("x-user-id");
  if (headerUserId) return headerUserId;

  const token = req.cookies.get("token")?.value;
  if (!token) {
    console.warn(
      "[/complete] No x-user-id header and no 'token' cookie. " +
        "Cookies present:",
      req.cookies.getAll().map((c) => c.name),
    );
    return null;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("[/complete] JWT_SECRET is not configured");
    return null;
  }

  try {
    const decoded = jwt.verify(token, secret);
    if (
      typeof decoded === "object" &&
      decoded !== null &&
      "userId" in decoded &&
      typeof (decoded as JwtPayload).userId === "string"
    ) {
      return (decoded as JwtPayload).userId;
    }
    return null;
  } catch (err) {
    console.warn("[/complete] JWT verify failed:", err);
    return null;
  }
}

/* ─────────────────────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────────────────────── */
function normalizeAnswer(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim().toLowerCase();
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
        subtopicCounts[sub] < ADAPTIVE_CONFIG.MAX_PER_SUBTOPIC ||
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

function sortForDisplay(
  questions: QuestionStub[],
  subject: Subject,
): QuestionStub[] {
  const arr = [...questions];

  if (subject === Subject.SAT_RW) {
    const order = ADAPTIVE_CONFIG.SAT_RW.displayOrder as readonly string[];
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

async function fillAdaptiveModule2(params: {
  examSectionId: string;
  subject: Subject;
  variant: "EASY" | "HARD";
  usedQuestionIds: string[];
}) {
  const { examSectionId, subject, variant, usedQuestionIds } = params;

  const config =
    subject === Subject.SAT_RW
      ? ADAPTIVE_CONFIG.SAT_RW
      : ADAPTIVE_CONFIG.SAT_MATH;

  const targetCount = config.questionsPerModule;
  const blueprint = config.blueprint as Record<string, number>;

  const pool = await prisma.question.findMany({
    where: {
      bankPurpose: { in: ["FULL_TEST", "MIXED"] },
      bankModule: { section: { subject } },
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
  });

  if (pool.length === 0) {
    console.warn(`[ADAPTIVE] Empty pool for ${subject} variant ${variant}`);
    return { selectedCount: 0, variant };
  }

  const primaryDifficulty = variant === "HARD" ? "HARD" : "EASY";
  const primaryPool = pool.filter((q) => q.difficulty === primaryDifficulty);

  let selected = selectByBlueprint(
    primaryPool as QuestionStub[],
    blueprint,
    targetCount,
  );

  if (selected.length < targetCount) {
    const usedIds = new Set(selected.map((q) => q.id));
    const fallbackPool = shuffle(
      pool.filter((q) => !usedIds.has(q.id)),
    ) as QuestionStub[];

    const extra = selectByBlueprint(
      fallbackPool,
      blueprint,
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

  if (selected.length < targetCount) {
    console.warn(
      `[ADAPTIVE] Not enough questions for ${subject} variant ${variant}. ` +
        `Have ${selected.length}, need ${targetCount}.`,
    );
  }

  const sorted = sortForDisplay(selected, subject);

  await prisma.examQuestion.deleteMany({ where: { examSectionId } });

  if (sorted.length > 0) {
    await prisma.examQuestion.createMany({
      data: sorted.map((q, i) => ({
        examSectionId,
        questionId: q.id,
        order: i + 1,
      })),
    });
  }

  await prisma.examSection.update({
    where: { id: examSectionId },
    data: { variant },
  });

  return { selectedCount: sorted.length, variant };
}

/* ─────────────────────────────────────────────────────────────
   POST handler
   ───────────────────────────────────────────────────────────── */
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { sectionId } = await params;

    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const clientTimeSpent =
      typeof body.timeSpent === "number" && body.timeSpent >= 0
        ? Math.floor(body.timeSpent)
        : undefined;

    const sectionSession = await prisma.fullTestSectionSession.findFirst({
      where: {
        id: sectionId,
        fullTestSession: { userId },
      },
      include: {
        fullTestSession: true,
        examSection: {
          include: {
            questions: {
              orderBy: { order: "asc" },
              include: {
                question: { include: { options: true } },
              },
            },
          },
        },
        answers: true,
      },
    });

    if (!sectionSession) {
      return NextResponse.json(
        { success: false, message: "Section session not found" },
        { status: 404 },
      );
    }

    const fullTestSession = sectionSession.fullTestSession;

    if (
      fullTestSession.status !== "IN_PROGRESS" &&
      fullTestSession.status !== "BREAK"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Full test session is no longer active",
        },
        { status: 400 },
      );
    }

    if (sectionSession.status === "COMPLETED") {
      return NextResponse.json({
        success: true,
        message: "Section already completed",
        data: {
          sectionSessionId: sectionSession.id,
          examSectionId: sectionSession.examSectionId,
          status: "COMPLETED",
          adaptive: null,
          breakInfo: null,
        },
      });
    }

    const examQuestions = sectionSession.examSection.questions;
    const totalQuestions = examQuestions.length;

    let answeredQuestions = 0;
    let correctAnswers = 0;

    let earnedWeight = 0;
    let totalWeight = 0;

    const answerResults = examQuestions
      .map((examQuestion) => {
        const question = examQuestion.question;
        const answer = sectionSession.answers.find(
          (item) => item.questionId === question.id,
        );

        if (!answer) return null;

        let isCorrect = false;

        if (question.type === "MCQ") {
          if (answer.selectedOptionId) {
            const selectedOption = question.options.find(
              (option) => option.id === answer.selectedOptionId,
            );
            isCorrect = selectedOption?.isCorrect === true;
          } else if (answer.textAnswer?.trim()) {
            const correctOption = question.options.find(
              (option) => option.isCorrect,
            );
            if (correctOption) {
              isCorrect =
                normalizeAnswer(answer.textAnswer) ===
                normalizeAnswer(correctOption.label);
            }
          }
        }

        if (question.type === "GRID_IN") {
          const expected =
            question.correctTextAnswer ?? question.correctAnswer ?? "";
          isCorrect =
            normalizeAnswer(answer.textAnswer) === normalizeAnswer(expected);
        }

        const answered =
          Boolean(answer.selectedOptionId) ||
          Boolean(answer.textAnswer?.trim());

        if (answered) answeredQuestions++;
        if (isCorrect) correctAnswers++;

        const w = diffWeight(question.difficulty);
        totalWeight += w;
        if (isCorrect) earnedWeight += w;

        return { answerId: answer.id, isCorrect };
      })
      .filter(
        (answer): answer is { answerId: string; isCorrect: boolean } =>
          answer !== null,
      );

    const unansweredQuestions = totalQuestions - answeredQuestions;
    const incorrectAnswers = answeredQuestions - correctAnswers;
    const percentage =
      totalQuestions > 0
        ? Math.round((correctAnswers / totalQuestions) * 100)
        : 0;

    const weightedPct = totalWeight > 0 ? earnedWeight / totalWeight : 0;

    const completedAt = new Date();

    if (answerResults.length > 0) {
      await Promise.all(
        answerResults.map((answer) =>
          prisma.fullTestAnswer.updateMany({
            where: {
              id: answer.answerId,
              fullTestSectionSessionId: sectionSession.id,
            },
            data: { isCorrect: answer.isCorrect },
          }),
        ),
      );
    }

    const currentSection = sectionSession.examSection;
    const isModule1 = currentSection.moduleNumber === 1;

    let adaptiveResult: {
      variant: "EASY" | "HARD";
      weightedPct: number;
      earnedWeight: number;
      totalWeight: number;
      correctCount: number;
      accuracy: number;
      filledCount: number;
      nextSectionId: string;
    } | null = null;

    if (isModule1) {
      const variant: "EASY" | "HARD" =
        weightedPct >= ADAPTIVE_CONFIG.WEIGHTED_THRESHOLD ? "HARD" : "EASY";

      const module2 = await prisma.examSection.findFirst({
        where: {
          examId: fullTestSession.examId,
          order: currentSection.order + 1,
        },
        select: { id: true, subject: true },
      });

      if (module2) {
        const usedQuestionIds = currentSection.questions.map(
          (q) => q.questionId,
        );

        const { selectedCount } = await fillAdaptiveModule2({
          examSectionId: module2.id,
          subject: module2.subject,
          variant,
          usedQuestionIds,
        });

        adaptiveResult = {
          variant,
          weightedPct,
          earnedWeight,
          totalWeight,
          correctCount: correctAnswers,
          accuracy: correctAnswers / totalQuestions,
          filledCount: selectedCount,
          nextSectionId: module2.id,
        };
      }
    }

    /* ─────────────────────────────────────────────────────────
       Transaction
       ───────────────────────────────────────────────────────── */
    let nextSectionSessionId: string | null = null;
    let breakInfo: {
      durationSeconds: number;
      startedAt: string;
      endsAt: string;
      nextSectionSessionId: string;
      nextExamSectionId: string;
    } | null = null;

    const nextSection = await prisma.$transaction(
      async (tx) => {
        const next = await tx.examSection.findFirst({
          where: {
            examId: fullTestSession.examId,
            order: { gt: currentSection.order },
          },
          orderBy: { order: "asc" },
          select: {
            id: true,
            title: true,
            subject: true,
            order: true,
            duration: true,
            variant: true,
          },
        });

        const serverSectionTime = sectionSession.startedAt
          ? Math.max(
              Math.floor(
                (completedAt.getTime() - sectionSession.startedAt.getTime()) /
                  1000,
              ),
              0,
            )
          : 0;
        const sectionTimeSpent = clientTimeSpent ?? serverSectionTime;

        await tx.fullTestSectionSession.update({
          where: { id: sectionSession.id },
          data: {
            status: "COMPLETED",
            completedAt,
            lastActivityAt: completedAt,
            remainingTime: 0,
            timeSpent: sectionTimeSpent,
          },
        });

        if (next) {
          const nextSectionSession = await tx.fullTestSectionSession.findUnique(
            {
              where: {
                fullTestSessionId_examSectionId: {
                  fullTestSessionId: fullTestSession.id,
                  examSectionId: next.id,
                },
              },
              select: { id: true, startedAt: true },
            },
          );

          if (!nextSectionSession) {
            throw new Error("Next section session not found.");
          }

          nextSectionSessionId = nextSectionSession.id;

          const hasBreak = (currentSection.breakAfter ?? 0) > 0;

          if (hasBreak) {
            const breakDurationSec = (currentSection.breakAfter ?? 0) * 60;
            const endsAt = new Date(
              completedAt.getTime() + breakDurationSec * 1000,
            );

            await tx.fullTestSession.update({
              where: { id: fullTestSession.id },
              data: {
                status: "BREAK",
                currentSectionOrder: next.order,
                lastActivityAt: completedAt,
              },
            });

            breakInfo = {
              durationSeconds: breakDurationSec,
              startedAt: completedAt.toISOString(),
              endsAt: endsAt.toISOString(),
              nextSectionSessionId: nextSectionSession.id,
              nextExamSectionId: next.id,
            };

            return next;
          }

          await tx.fullTestSectionSession.update({
            where: { id: nextSectionSession.id },
            data: {
              status: "IN_PROGRESS",
              startedAt: nextSectionSession.startedAt ?? completedAt,
              lastActivityAt: completedAt,
              remainingTime: next.duration * 60,
            },
          });

          await tx.fullTestSession.update({
            where: { id: fullTestSession.id },
            data: {
              currentSectionOrder: next.order,
              lastActivityAt: completedAt,
            },
          });

          return next;
        }

        /* ─── Module CUỐI: aggregate toàn bộ + compute scaledScore ─── */
        const allSections = await tx.fullTestSectionSession.findMany({
          where: { fullTestSessionId: fullTestSession.id },
          select: {
            timeSpent: true,
            examSection: {
              select: {
                subject: true,
                title: true,
                questions: { select: { questionId: true } },
              },
            },
            answers: {
              select: {
                selectedOptionId: true,
                textAnswer: true,
                isCorrect: true,
                timeSpent: true,
              },
            },
          },
        });

        let totalCorrect = 0;
        let totalWrong = 0;
        let totalAnswered = 0;
        let totalQuestionsAll = 0;
        let sumSectionTime = 0;

        /* NEW: raw per subject */
        let rwCorrect = 0;
        let rwTotal = 0;
        let mathCorrect = 0;
        let mathTotal = 0;
        let rwIsHard = false;
        let mathIsHard = false;

        for (const s of allSections) {
          const isRW = s.examSection.subject === Subject.SAT_RW;
          const sectionQ = s.examSection.questions.length;

          totalQuestionsAll += sectionQ;
          sumSectionTime += s.timeSpent ?? 0;

          if (isRW) {
            rwTotal += sectionQ;
            if ((s.examSection.title ?? "").toLowerCase().includes("hard")) {
              rwIsHard = true;
            }
          } else {
            mathTotal += sectionQ;
            if ((s.examSection.title ?? "").toLowerCase().includes("hard")) {
              mathIsHard = true;
            }
          }

          for (const a of s.answers) {
            const isAns =
              a.selectedOptionId !== null ||
              (a.textAnswer !== null && a.textAnswer.trim() !== "");

            if (isAns) totalAnswered++;
            if (a.isCorrect === true) {
              totalCorrect++;
              if (isRW) rwCorrect++;
              else mathCorrect++;
            } else if (a.isCorrect === false) {
              totalWrong++;
            }
          }
        }

        /* Compute scaledScore */
        const rwScaled = computeSubjectScaled(
          "RW",
          rwCorrect,
          rwTotal,
          rwIsHard,
        );
        const mathScaled = computeSubjectScaled(
          "MATH",
          mathCorrect,
          mathTotal,
          mathIsHard,
        );
        const scaledScore = rwScaled + mathScaled;

        const totalSkipped = Math.max(totalQuestionsAll - totalAnswered, 0);

        const wallClock = Math.max(
          Math.floor(
            (completedAt.getTime() - fullTestSession.startedAt.getTime()) /
              1000,
          ),
          0,
        );
        const totalTimeSpent = sumSectionTime > 0 ? sumSectionTime : wallClock;

        await tx.fullTestSession.update({
          where: { id: fullTestSession.id },
          data: {
            status: "COMPLETED",
            completedAt,
            lastActivityAt: completedAt,

            totalCorrect,
            totalWrong,
            totalSkipped,
            rawScore: totalCorrect,
            totalTimeSpent,
            scaledScore,
          },
        });

        console.info("[FullTest] Completed & aggregated", {
          fullTestSessionId: fullTestSession.id,
          totalQuestions: totalQuestionsAll,
          totalAnswered,
          totalCorrect,
          totalWrong,
          totalSkipped,
          rawScore: totalCorrect,
          rwCorrect,
          rwTotal,
          mathCorrect,
          mathTotal,
          rwScaled,
          mathScaled,
          scaledScore,
          sumSectionTime,
          wallClock,
          totalTimeSpent,
        });

        return null;
      },
      { timeout: 15000 },
    );

    return NextResponse.json({
      success: true,
      message: "Section completed successfully",
      data: {
        sectionSessionId: sectionSession.id,
        examSectionId: sectionSession.examSectionId,

        section: {
          id: currentSection.id,
          title: currentSection.title,
          subject: currentSection.subject,
          order: currentSection.order,
          moduleNumber: currentSection.moduleNumber,
        },

        status: "COMPLETED",

        result: {
          totalQuestions,
          answeredQuestions,
          unansweredQuestions,
          correctAnswers,
          incorrectAnswers,
          percentage,
          earnedWeight,
          totalWeight,
          weightedPct,
        },

        adaptive: adaptiveResult,

        nextSection: nextSection
          ? {
              id: nextSection.id,
              sectionSessionId: nextSectionSessionId,
              title: nextSection.title,
              subject: nextSection.subject,
              order: nextSection.order,
              variant: nextSection.variant,
            }
          : null,

        nextSectionOrder: nextSection?.order ?? null,

        breakInfo,
      },
    });
  } catch (error) {
    console.error(
      "POST /api/full-test/sessions/sections/[sectionId]/complete error:",
      error,
    );

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
