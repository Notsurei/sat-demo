"use server";

import { NextResponse } from "next/server";
import { prisma } from "../../../../util/prisma";

interface RouteContext {
  params: Promise<{ sessionId: string }>;
}

const SAT_MATH_MAX_RAW = 44;

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
      return Math.round(y0 + ((raw - x0) / (x1 - x0)) * (y1 - y0));
    }
  }
  return last[1];
}

function computeScaled(c: number, t: number, h: boolean): number {
  if (t === 0) return 200;
  const n = Math.round((c / t) * SAT_MATH_MAX_RAW);
  const s = rawToScaled(n, h ? MATH_SCALE_HARD : MATH_SCALE_EASY);
  return Math.round(Math.max(200, Math.min(800, s)) / 10) * 10;
}

const norm = (v: string | null | undefined): string =>
  (v ?? "").trim().toLowerCase().replace(/\s+/g, "");

interface QuestionShape {
  type: string;
  correctAnswer: string | null;
  correctTextAnswer: string | null;
  options: { id: string; isCorrect: boolean }[];
}

interface AnswerShape {
  selectedOptionId: string | null;
  textAnswer: string | null;
  isCorrect: boolean | null;
}

function resolveIsCorrect(
  q: QuestionShape,
  a: AnswerShape | undefined,
): boolean | null {
  if (!a) return null;
  const hasOpt = a.selectedOptionId !== null;
  const hasTxt = (a.textAnswer ?? "").trim() !== "";
  if (!hasOpt && !hasTxt) return null;
  if (a.isCorrect === true || a.isCorrect === false) return a.isCorrect;
  if (String(q.type).toUpperCase() === "MCQ") {
    if (!a.selectedOptionId) return null;
    const c = q.options.find((o) => o.isCorrect);
    return c ? a.selectedOptionId === c.id : null;
  }
  const exp = q.correctTextAnswer ?? q.correctAnswer ?? null;
  return exp === null ? null : norm(a.textAnswer) === norm(exp);
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { sessionId } = await context.params;

    const session = await prisma.mathModuleSession.findFirst({
      where: { id: sessionId, userId },
      select: {
        id: true,
        status: true,
        startedAt: true,
        completedAt: true,
        timeSpent: true,
        totalCorrect: true,
        totalWrong: true,
        totalSkipped: true,
        rawScore: true,
        scaledScore: true,
        exam: {
          select: {
            id: true,
            title: true,
            version: true,
            totalQuestions: true,
            duration: true,
          },
        },
        sections: {
          orderBy: { examSection: { moduleNumber: "asc" } },
          select: {
            id: true,
            status: true,
            startedAt: true,
            completedAt: true,
            timeSpent: true,
            examSection: {
              select: {
                id: true,
                subject: true,
                title: true,
                order: true,
                duration: true,
                moduleNumber: true,
                variant: true,
                questions: {
                  orderBy: { order: "asc" },
                  select: {
                    questionId: true,
                    order: true,
                    question: {
                      select: {
                        id: true,
                        externalId: true,
                        prompt: true,
                        passage: true,
                        domain: true,
                        subtopic: true,
                        difficulty: true,
                        type: true,
                        correctAnswer: true,
                        correctTextAnswer: true,
                        explanation: true,
                        options: {
                          orderBy: { label: "asc" },
                          select: {
                            id: true,
                            label: true,
                            content: true,
                            isCorrect: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            answers: {
              select: {
                questionId: true,
                selectedOptionId: true,
                textAnswer: true,
                isCorrect: true,
                isFlagged: true,
                timeSpent: true,
                answeredAt: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Session not found" },
        { status: 404 },
      );
    }

    const questions = session.sections.flatMap((section) =>
      section.examSection.questions.map((eq) => {
        const q = eq.question;
        const a = section.answers.find((x) => x.questionId === eq.questionId);
        const selOpt = a?.selectedOptionId
          ? (q.options.find((o) => o.id === a.selectedOptionId) ?? null)
          : null;
        const corOpt = q.options.find((o) => o.isCorrect) ?? null;
        const isCorrect = resolveIsCorrect(
          {
            type: String(q.type),
            correctAnswer: q.correctAnswer ?? null,
            correctTextAnswer: q.correctTextAnswer ?? null,
            options: q.options.map((o) => ({
              id: o.id,
              isCorrect: o.isCorrect,
            })),
          },
          a
            ? {
                selectedOptionId: a.selectedOptionId ?? null,
                textAnswer: a.textAnswer ?? null,
                isCorrect: a.isCorrect ?? null,
              }
            : undefined,
        );

        return {
          number: eq.order,
          questionId: q.id,
          externalId: q.externalId,
          subject: section.examSection.subject,
          sectionId: section.examSection.id,
          sectionTitle: section.examSection.title,
          sectionOrder: section.examSection.order,
          moduleNumber: section.examSection.moduleNumber,
          prompt: q.prompt,
          passage: q.passage,
          domain: q.domain,
          subtopic: q.subtopic,
          difficulty: q.difficulty,
          type: q.type,
          options: q.options.map((o) => ({
            id: o.id,
            label: o.label,
            content: o.content,
          })),
          selectedAnswer: a
            ? {
                id: selOpt?.id ?? null,
                label: selOpt?.label ?? null,
                content: selOpt?.content ?? null,
                text: a.textAnswer ?? null,
              }
            : null,
          correctAnswer: corOpt
            ? {
                id: corOpt.id,
                label: corOpt.label,
                content: corOpt.content,
                text: q.correctTextAnswer ?? null,
              }
            : {
                id: null,
                label: null,
                content: null,
                text: q.correctTextAnswer ?? q.correctAnswer ?? null,
              },
          isCorrect,
          isFlagged: a?.isFlagged ?? false,
          answeredAt: a?.answeredAt ?? null,
          timeSpent: a?.timeSpent ?? 0,
          explanation: q.explanation,
          proTips: null,
        };
      }),
    );

    const totalQuestions = questions.length;
    const answeredQuestions = questions.filter(
      (q) => q.isCorrect !== null,
    ).length;
    const correctAnswers = questions.filter((q) => q.isCorrect === true).length;
    const wrongAnswers = questions.filter((q) => q.isCorrect === false).length;
    const skippedAnswers = totalQuestions - answeredQuestions;

    const accuracy =
      answeredQuestions > 0
        ? Number(((correctAnswers / answeredQuestions) * 100).toFixed(2))
        : 0;

    const sections = session.sections.map((section) => {
      const sQs = questions.filter(
        (q) => q.sectionId === section.examSection.id,
      );
      const total = sQs.length;
      const answered = sQs.filter((q) => q.isCorrect !== null).length;
      const correct = sQs.filter((q) => q.isCorrect === true).length;
      const wrong = sQs.filter((q) => q.isCorrect === false).length;
      const skipped = total - answered;
      const acc =
        answered > 0 ? Number(((correct / answered) * 100).toFixed(2)) : 0;

      return {
        id: section.id,
        sectionId: section.examSection.id,
        title: section.examSection.title,
        subject: section.examSection.subject,
        order: section.examSection.order,
        moduleNumber: section.examSection.moduleNumber,
        variant: section.examSection.variant,
        total,
        answered,
        unanswered: skipped,
        correct,
        incorrect: wrong,
        accuracy: acc,
        timeSpent: section.timeSpent,
        duration: section.examSection.duration,
        durationSeconds: section.examSection.duration * 60,
        startedAt: section.startedAt,
        completedAt: section.completedAt,
        questions: sQs,
      };
    });

    const difficultyStats = {
      EASY: { total: 0, correct: 0, accuracy: 0 },
      MEDIUM: { total: 0, correct: 0, accuracy: 0 },
      HARD: { total: 0, correct: 0, accuracy: 0 },
    };

    questions.forEach((q) => {
      const lvl = q.difficulty as "EASY" | "MEDIUM" | "HARD" | null;
      if (!lvl || !(lvl in difficultyStats)) return;
      difficultyStats[lvl].total++;
      if (q.isCorrect === true) difficultyStats[lvl].correct++;
    });

    (["EASY", "MEDIUM", "HARD"] as const).forEach((lvl) => {
      const s = difficultyStats[lvl];
      const ans = questions.filter(
        (q) => q.difficulty === lvl && q.isCorrect !== null,
      ).length;
      s.accuracy = ans > 0 ? Number(((s.correct / ans) * 100).toFixed(2)) : 0;
    });

    const domMap = new Map<
      string,
      { domain: string; total: number; answered: number; correct: number }
    >();

    questions.forEach((q) => {
      const dom = q.domain?.trim() || "Other";
      if (!domMap.has(dom))
        domMap.set(dom, { domain: dom, total: 0, answered: 0, correct: 0 });
      const s = domMap.get(dom)!;
      s.total++;
      if (q.isCorrect !== null) s.answered++;
      if (q.isCorrect === true) s.correct++;
    });

    const domains = Array.from(domMap.values())
      .map((s) => ({
        domain: s.domain,
        total: s.total,
        answered: s.answered,
        unanswered: s.total - s.answered,
        correct: s.correct,
        incorrect: s.answered - s.correct,
        accuracy:
          s.answered > 0
            ? Number(((s.correct / s.answered) * 100).toFixed(2))
            : 0,
      }))
      .sort((a, b) => b.accuracy - a.accuracy);

    const isHardPath = sections.some(
      (s) => s.variant === "HARD" || s.title.toLowerCase().includes("hard"),
    );

    const scaledScore =
      session.scaledScore ??
      computeScaled(correctAnswers, totalQuestions, isHardPath);

    return NextResponse.json({
      success: true,
      data: {
        session: {
          id: session.id,
          examId: session.exam.id,
          status: session.status,
          startedAt: session.startedAt,
          completedAt: session.completedAt,
          totalTimeSpent: session.timeSpent,
        },
        exam: session.exam,
        summary: {
          total: totalQuestions,
          answered: answeredQuestions,
          unanswered: skippedAnswers,
          correct: correctAnswers,
          incorrect: wrongAnswers,
          accuracy,
          rawScore: session.rawScore ?? correctAnswers,
          scaledScore,
        },
        scores: {
          scaled: scaledScore,
          maxScaled: 800,
          path: isHardPath ? "HARD" : "EASY",
        },
        sections,
        difficulty: difficultyStats,
        domains,
        questions,
      },
    });
  } catch (error) {
    console.error("[MathResult] Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch result" },
      { status: 500 },
    );
  }
}
