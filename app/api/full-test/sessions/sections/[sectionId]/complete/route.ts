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

interface QuestionStub {
  id: string;
  difficulty: string;
  domain: string | null;
  subtopic: string | null;
}

function getUserIdFromRequest(req: NextRequest): string | null {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;

  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");

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
  } catch {
    return null;
  }
}

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
  targetCount: number
): QuestionStub[] {
  const subtopicCounts: Record<string, number> = {};
  const selected: QuestionStub[] = [];

  for (const [dom, targetPerDom] of Object.entries(blueprint)) {
    const domQs = shuffle(
      pool.filter((q) => normalizeDomain(q.domain) === dom)
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
  subject: Subject
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
    targetCount
  );

  if (selected.length < targetCount) {
    const usedIds = new Set(selected.map((q) => q.id));
    const fallbackPool = shuffle(
      pool.filter((q) => !usedIds.has(q.id))
    ) as QuestionStub[];

    const extra = selectByBlueprint(
      fallbackPool,
      blueprint,
      targetCount - selected.length
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
        `Have ${selected.length}, need ${targetCount}.`
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

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { sectionId } = await params;

    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

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
        { status: 404 }
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
        { status: 400 }
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
          (item) => item.questionId === question.id
        );

        if (!answer) return null;

        let isCorrect = false;

        if (question.type === "MCQ") {
          if (answer.selectedOptionId) {
            const selectedOption = question.options.find(
              (option) => option.id === answer.selectedOptionId
            );
            isCorrect = selectedOption?.isCorrect === true;
          } else if (answer.textAnswer?.trim()) {
            const correctOption = question.options.find(
              (option) => option.isCorrect
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
          answer !== null
      );

    const unansweredQuestions = totalQuestions - answeredQuestions;
    const incorrectAnswers = answeredQuestions - correctAnswers;
    const percentage =
      totalQuestions > 0
        ? Math.round((correctAnswers / totalQuestions) * 100)
        : 0;

    const weightedPct =
      totalWeight > 0 ? earnedWeight / totalWeight : 0;

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
          })
        )
      );
    }

    const currentSection = sectionSession.examSection;
    const isModule1 = currentSection.moduleNumber === 1;

    let adaptiveResult:
      | {
          variant: "EASY" | "HARD";
          weightedPct: number;
          earnedWeight: number;
          totalWeight: number;
          correctCount: number;
          accuracy: number;
          filledCount: number;
          nextSectionId: string;
        }
      | null = null;

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
          (q) => q.questionId
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

        await tx.fullTestSectionSession.update({
          where: { id: sectionSession.id },
          data: {
            status: "COMPLETED",
            completedAt,
            lastActivityAt: completedAt,
            remainingTime: 0,
          },
        });

        if (next) {
          const nextSectionSession =
            await tx.fullTestSectionSession.findUnique({
              where: {
                fullTestSessionId_examSectionId: {
                  fullTestSessionId: fullTestSession.id,
                  examSectionId: next.id,
                },
              },
            });

          if (!nextSectionSession) {
            throw new Error("Next section session not found.");
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
        }

        await tx.fullTestSession.update({
          where: { id: fullTestSession.id },
          data: {
            ...(next ? { currentSectionOrder: next.order } : {}),
            lastActivityAt: completedAt,
          },
        });

        return next;
      },
      { timeout: 15000 }
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
              title: nextSection.title,
              subject: nextSection.subject,
              order: nextSection.order,
              variant: nextSection.variant,
            }
          : null,

        nextSectionOrder: nextSection?.order ?? null,
      },
    });
  } catch (error) {
    console.error(
      "POST /api/full-test/sessions/sections/[sectionId]/complete error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to complete section",
      },
      { status: 500 }
    );
  }
}