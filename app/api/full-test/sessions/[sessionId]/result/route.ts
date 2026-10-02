"use server";

import { NextResponse } from "next/server";
import { prisma } from "../../../../util/prisma";

interface RouteContext {
  params: Promise<{
    sessionId: string;
  }>;
}

/* ------------------------------------------------------------------ */
/*  CONSTANTS — SAT SCORING                                            */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/*  HELPERS                                                            */
/* ------------------------------------------------------------------ */
const normalizeText = (value: string | null | undefined): string =>
  (value ?? "").trim().toLowerCase().replace(/\s+/g, "");

interface QuestionRow {
  type: string;
  correctAnswer: string | null;
  correctTextAnswer: string | null;
  options: { id: string; isCorrect: boolean }[];
}

interface AnswerRow {
  selectedOptionId: string | null;
  textAnswer: string | null;
  isCorrect: boolean | null;
}

function resolveIsCorrect(
  question: QuestionRow,
  answer: AnswerRow | undefined,
): boolean | null {
  if (!answer) return null;

  const hasOption = answer.selectedOptionId !== null;
  const hasText = (answer.textAnswer ?? "").trim() !== "";

  if (!hasOption && !hasText) return null;

  if (answer.isCorrect === true || answer.isCorrect === false) {
    return answer.isCorrect;
  }

  const isMcq = String(question.type).toUpperCase() === "MCQ";

  if (isMcq) {
    if (!answer.selectedOptionId) return null;
    const correctOption = question.options.find((o) => o.isCorrect);
    if (!correctOption) return null;
    return answer.selectedOptionId === correctOption.id;
  }

  const expected = question.correctTextAnswer ?? question.correctAnswer ?? null;
  if (expected === null) return null;

  return normalizeText(answer.textAnswer) === normalizeText(expected);
}

/** Interpolate raw → scaled trên bảng piecewise linear. */
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

interface QuestionForIrt {
  difficulty: string | null;
  isCorrect: boolean | null;
}

function computeIrtModifier(
  questions: QuestionForIrt[],
  isHardPath: boolean,
): number {
  let mod = 0;
  questions.forEach((q) => {
    const lvl = (q.difficulty ?? "MEDIUM").toUpperCase();
    const isCor = q.isCorrect === true;
    if (!isCor && lvl === "EASY") mod -= 10;
    if (isCor && lvl === "HARD" && isHardPath) mod += 10;
  });
  return Math.max(-30, Math.min(30, mod));
}

/** Detect Hard path từ section title. */
function detectHardPath(titles: string[]): boolean {
  return titles.some((t) => {
    const s = (t ?? "").toLowerCase();
    return s.includes("hard") || s.includes("advanced");
  });
}

/**
 * Tính scaled score theo bảng SAT + IRT modifier.
 * Normalize raw về thang chuẩn (54 RW / 44 Math).
 */
function computeSubjectScaled(
  subject: "RW" | "MATH",
  correct: number,
  total: number,
  questions: QuestionForIrt[],
  isHard: boolean,
): number | null {
  if (total === 0) return null;

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

  const base = rawToScaled(normalizedRaw, table);
  const irt = computeIrtModifier(questions, isHard);

  const clamped = Math.max(200, Math.min(800, base + irt));
  return Math.round(clamped / 10) * 10;
}

/* ------------------------------------------------------------------ */
/*  ROUTE                                                              */
/* ------------------------------------------------------------------ */
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

    if (!sessionId) {
      return NextResponse.json(
        { success: false, message: "Session ID is required" },
        { status: 400 },
      );
    }

    const session = await prisma.fullTestSession.findFirst({
      where: { id: sessionId, userId },
      select: {
        id: true,
        status: true,
        startedAt: true,
        completedAt: true,
        totalTimeSpent: true,
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
          orderBy: { examSection: { order: "asc" } },
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
                breakAfter: true,

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

    if (session.status !== "COMPLETED") {
      return NextResponse.json(
        {
          success: false,
          message: "Test result is not available until the test is completed",
          status: session.status,
        },
        { status: 409 },
      );
    }

    /* ── Build questions ──────────────────────────────────────────── */
    const questions = session.sections.flatMap((section) =>
      section.examSection.questions.map((examQuestion) => {
        const question = examQuestion.question;

        const answer = section.answers.find(
          (item) => item.questionId === examQuestion.questionId,
        );

        const selectedOption = answer?.selectedOptionId
          ? (question.options.find(
              (option) => option.id === answer.selectedOptionId,
            ) ?? null)
          : null;

        const correctOption =
          question.options.find((option) => option.isCorrect) ?? null;

        const isCorrect = resolveIsCorrect(
          {
            type: String(question.type),
            correctAnswer: question.correctAnswer ?? null,
            correctTextAnswer: question.correctTextAnswer ?? null,
            options: question.options.map((o) => ({
              id: o.id,
              isCorrect: o.isCorrect,
            })),
          },
          answer
            ? {
                selectedOptionId: answer.selectedOptionId ?? null,
                textAnswer: answer.textAnswer ?? null,
                isCorrect: answer.isCorrect ?? null,
              }
            : undefined,
        );

        return {
          number: examQuestion.order,
          questionId: question.id,
          externalId: question.externalId,
          subject: section.examSection.subject,
          sectionId: section.examSection.id,
          sectionTitle: section.examSection.title,
          sectionOrder: section.examSection.order,

          prompt: question.prompt,
          passage: question.passage,
          domain: question.domain,
          subtopic: question.subtopic,
          difficulty: question.difficulty,
          type: question.type,

          options: question.options.map((option) => ({
            id: option.id,
            label: option.label,
            content: option.content,
          })),

          selectedAnswer: answer
            ? {
                id: selectedOption?.id ?? null,
                label: selectedOption?.label ?? null,
                content: selectedOption?.content ?? null,
                text: answer.textAnswer ?? null,
              }
            : null,

          correctAnswer: correctOption
            ? {
                id: correctOption.id,
                label: correctOption.label,
                content: correctOption.content,
                text: question.correctTextAnswer ?? null,
              }
            : {
                id: null,
                label: null,
                content: null,
                text:
                  question.correctTextAnswer ?? question.correctAnswer ?? null,
              },

          isCorrect,

          isFlagged: answer?.isFlagged ?? false,
          answeredAt: answer?.answeredAt ?? null,
          timeSpent: answer?.timeSpent ?? 0,

          explanation: question.explanation,
          proTips: null,
        };
      }),
    );

    /* ── Summary ──────────────────────────────────────────────────── */
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

    /* ── Sections ─────────────────────────────────────────────────── */
    const sections = session.sections.map((section) => {
      const sectionQuestions = questions.filter(
        (q) => q.sectionId === section.examSection.id,
      );

      const sectionTotal = sectionQuestions.length;

      const sectionAnswered = sectionQuestions.filter(
        (q) => q.isCorrect !== null,
      ).length;

      const sectionCorrect = sectionQuestions.filter(
        (q) => q.isCorrect === true,
      ).length;

      const sectionWrong = sectionQuestions.filter(
        (q) => q.isCorrect === false,
      ).length;

      const sectionSkipped = sectionTotal - sectionAnswered;

      const sectionAccuracy =
        sectionAnswered > 0
          ? Number(((sectionCorrect / sectionAnswered) * 100).toFixed(2))
          : 0;

      return {
        id: section.id,
        sectionId: section.examSection.id,
        title: section.examSection.title,
        subject: section.examSection.subject,
        order: section.examSection.order,

        total: sectionTotal,
        answered: sectionAnswered,
        unanswered: sectionSkipped,
        correct: sectionCorrect,
        incorrect: sectionWrong,
        accuracy: sectionAccuracy,

        timeSpent: section.timeSpent,
        duration: section.examSection.duration,
        durationSeconds: section.examSection.duration * 60,

        startedAt: section.startedAt,
        completedAt: section.completedAt,

        questions: sectionQuestions,
      };
    });

    /* ── Difficulty ───────────────────────────────────────────────── */
    const difficultyStats = {
      EASY: { total: 0, correct: 0, accuracy: 0 },
      MEDIUM: { total: 0, correct: 0, accuracy: 0 },
      HARD: { total: 0, correct: 0, accuracy: 0 },
    };

    questions.forEach((q) => {
      const level = q.difficulty as "EASY" | "MEDIUM" | "HARD" | null;
      if (!level || !(level in difficultyStats)) return;

      difficultyStats[level].total++;
      if (q.isCorrect === true) difficultyStats[level].correct++;
    });

    (["EASY", "MEDIUM", "HARD"] as const).forEach((level) => {
      const stat = difficultyStats[level];
      const answered = questions.filter(
        (q) => q.difficulty === level && q.isCorrect !== null,
      ).length;
      stat.accuracy =
        answered > 0 ? Number(((stat.correct / answered) * 100).toFixed(2)) : 0;
    });

    /* ── Domains ──────────────────────────────────────────────────── */
    const domainMap = new Map<
      string,
      { domain: string; total: number; answered: number; correct: number }
    >();

    questions.forEach((q) => {
      const domain = q.domain?.trim() || "Other";

      if (!domainMap.has(domain)) {
        domainMap.set(domain, { domain, total: 0, answered: 0, correct: 0 });
      }

      const stat = domainMap.get(domain)!;
      stat.total++;
      if (q.isCorrect !== null) stat.answered++;
      if (q.isCorrect === true) stat.correct++;
    });

    const domains = Array.from(domainMap.values())
      .map((stat) => ({
        domain: stat.domain,
        total: stat.total,
        answered: stat.answered,
        unanswered: stat.total - stat.answered,
        correct: stat.correct,
        incorrect: stat.answered - stat.correct,
        accuracy:
          stat.answered > 0
            ? Number(((stat.correct / stat.answered) * 100).toFixed(2))
            : 0,
      }))
      .sort((a, b) => b.accuracy - a.accuracy);

    /* ── Scores ───────────────────────────────────────────────────── */
    const isRw = (subject: string) => {
      const s = subject.toUpperCase();
      return s === "SAT_RW" || s.includes("RW") || s.includes("READING");
    };
    const isMath = (subject: string) => {
      const s = subject.toUpperCase();
      return s === "SAT_MATH" || s.includes("MATH");
    };

    const rwSections = sections.filter((s) => isRw(s.subject));
    const mathSections = sections.filter((s) => isMath(s.subject));

    const rwCorrect = rwSections.reduce((sum, s) => sum + s.correct, 0);
    const rwTotal = rwSections.reduce((sum, s) => sum + s.total, 0);
    const mathCorrect = mathSections.reduce((sum, s) => sum + s.correct, 0);
    const mathTotal = mathSections.reduce((sum, s) => sum + s.total, 0);

    const rwIsHard = detectHardPath(rwSections.map((s) => s.title));
    const mathIsHard = detectHardPath(mathSections.map((s) => s.title));

    const rwQuestionsForIrt: QuestionForIrt[] = rwSections.flatMap((s) =>
      s.questions.map((q) => ({
        difficulty: q.difficulty ?? null,
        isCorrect: q.isCorrect,
      })),
    );

    const mathQuestionsForIrt: QuestionForIrt[] = mathSections.flatMap((s) =>
      s.questions.map((q) => ({
        difficulty: q.difficulty ?? null,
        isCorrect: q.isCorrect,
      })),
    );

    const rwScaled = computeSubjectScaled(
      "RW",
      rwCorrect,
      rwTotal,
      rwQuestionsForIrt,
      rwIsHard,
    );

    const mathScaled = computeSubjectScaled(
      "MATH",
      mathCorrect,
      mathTotal,
      mathQuestionsForIrt,
      mathIsHard,
    );

    let totalScaled: number | null = null;
    if (rwScaled !== null && mathScaled !== null) {
      totalScaled = rwScaled + mathScaled;
    } else if (rwScaled !== null) {
      totalScaled = rwScaled;
    } else if (mathScaled !== null) {
      totalScaled = mathScaled;
    }

    const scores = {
      total: totalScaled,
      readingWriting: rwScaled,
      math: mathScaled,
    };

    return NextResponse.json(
      {
        success: true,

        data: {
          session: {
            id: session.id,
            examId: session.exam.id,
            status: session.status,
            startedAt: session.startedAt,
            completedAt: session.completedAt,
            totalTimeSpent: session.totalTimeSpent ?? null,
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
            scaledScore: totalScaled,
          },

          scores,
          sections,
          difficulty: difficultyStats,
          domains,
          questions,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    // console.error(
    //   "GET /api/full-test/sessions/[sessionId]/result error:",
    //   error,
    // );

    return NextResponse.json(
      { success: false, message: "Failed to fetch test result" },
      { status: 500 },
    );
  }
}
