"use server";

import { NextResponse } from "next/server";
import { prisma } from "@/app/api/util/prisma";

export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ practiceId: string }>;
  },
) {
  try {
    const { practiceId } = await params;

    const practice = await prisma.practice.findUnique({
      where: {
        id: practiceId,
      },
      include: {
        answers: {
          include: {
            question: {
              include: {
                options: true,
              },
            },
            selectedOption: true,
          },
        },
      },
    });

    if (!practice) {
      return NextResponse.json(
        {
          success: false,
          error: "Practice not found",
        },
        { status: 404 },
      );
    }

    const practiceAnswers = [...practice.answers].sort(
      (a, b) => a.question.order - b.question.order,
    );

    const total = practice.totalQuestions;

    const answered = practiceAnswers.filter(
      (answer) =>
        answer.selectedOptionId !== null || answer.textAnswer !== null,
    ).length;

    const correct = practiceAnswers.filter(
      (answer) => answer.isCorrect === true,
    ).length;

    const incorrect = practiceAnswers.filter(
      (answer) => answer.isCorrect === false,
    ).length;

    const unanswered = Math.max(total - answered, 0);

    const accuracy =
      total > 0 ? Math.min(100, Math.round((correct / total) * 100)) : 0;

    const difficultyStats = {
      EASY: {
        total: 0,
        correct: 0,
        accuracy: 0,
      },
      MEDIUM: {
        total: 0,
        correct: 0,
        accuracy: 0,
      },
      HARD: {
        total: 0,
        correct: 0,
        accuracy: 0,
      },
    };

    for (const answer of practiceAnswers) {
      const difficulty = answer.question.difficulty;

      if (!difficulty) continue;

      if (difficulty in difficultyStats) {
        difficultyStats[difficulty].total += 1;

        if (answer.isCorrect === true) {
          difficultyStats[difficulty].correct += 1;
        }
      }
    }

    for (const difficulty of Object.keys(difficultyStats) as Array<
      keyof typeof difficultyStats
    >) {
      const stat = difficultyStats[difficulty];

      stat.accuracy =
        stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
    }

    const domainMap = new Map<
      string,
      {
        domain: string;
        total: number;
        correct: number;
      }
    >();

    for (const answer of practiceAnswers) {
      const domain = answer.question.domain || "Other";

      if (!domainMap.has(domain)) {
        domainMap.set(domain, {
          domain,
          total: 0,
          correct: 0,
        });
      }

      const stat = domainMap.get(domain)!;

      stat.total += 1;

      if (answer.isCorrect === true) {
        stat.correct += 1;
      }
    }

    const domains = Array.from(domainMap.values()).map((stat) => ({
      ...stat,

      accuracy:
        stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0,
    }));

    const subtopicMap = new Map<
      string,
      {
        subtopic: string;
        domain: string;
        total: number;
        correct: number;
      }
    >();

    for (const answer of practiceAnswers) {
      const subtopic = answer.question.subtopic || "Other";

      const domain = answer.question.domain || "Other";

      const key = `${domain}::${subtopic}`;

      if (!subtopicMap.has(key)) {
        subtopicMap.set(key, {
          subtopic,
          domain,
          total: 0,
          correct: 0,
        });
      }

      const stat = subtopicMap.get(key)!;

      stat.total += 1;

      if (answer.isCorrect === true) {
        stat.correct += 1;
      }
    }

    const subtopics = Array.from(subtopicMap.values()).map((stat) => ({
      ...stat,

      accuracy:
        stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0,
    }));

    const questionTimes = practiceAnswers.map(
      (answer) => answer.timeSpent ?? 0,
    );

    const totalQuestionTime = questionTimes.reduce(
      (sum, time) => sum + time,
      0,
    );

    const answeredTimes = practiceAnswers
      .filter(
        (answer) =>
          answer.selectedOptionId !== null || answer.textAnswer !== null,
      )
      .map((answer) => answer.timeSpent ?? 0);

    const averageTimePerQuestion =
      questionTimes.length > 0
        ? Math.round(totalQuestionTime / questionTimes.length)
        : 0;

    const averageTimeAnswered =
      answeredTimes.length > 0
        ? Math.round(
            answeredTimes.reduce((sum, time) => sum + time, 0) /
              answeredTimes.length,
          )
        : 0;

    const questions = practiceAnswers.map((answer, index) => {
      const question = answer.question;

      const correctOption =
        question.options.find((option) => option.isCorrect) ?? null;

      let selectedAnswer = null;

      if (answer.selectedOption) {
        selectedAnswer = {
          id: answer.selectedOption.id,
          label: answer.selectedOption.label,
          content: answer.selectedOption.content,
        };
      } else if (answer.textAnswer !== null) {
        selectedAnswer = {
          text: answer.textAnswer,
        };
      }

      let correctAnswer = null;

      if (question.type === "MCQ") {
        if (correctOption) {
          correctAnswer = {
            id: correctOption.id,
            label: correctOption.label,
            content: correctOption.content,
          };
        }
      } else {
        correctAnswer = {
          text: question.correctTextAnswer ?? question.correctAnswer ?? null,
        };
      }

      const options = question.options.map((option) => ({
        id: option.id,
        label: option.label,
        content: option.content,
      }));

      return {
        number: index + 1,

        questionId: question.id,
        externalId: question.externalId,

        prompt: question.prompt,
        passage: question.passage,

        domain: question.domain,
        subtopic: question.subtopic,
        difficulty: question.difficulty,

        type: question.type,

        options,

        selectedAnswer,
        correctAnswer,

        isCorrect: answer.isCorrect,

        timeSpent: answer.timeSpent ?? 0,

        explanation: question.explanation,
        proTips: null,
      };
    });

    return NextResponse.json({
      success: true,

      practice: {
        id: practice.id,

        subject: practice.subject,
        domain: practice.domain,
        subtopic: practice.subtopic,
        mode: practice.mode,
        status: practice.status,

        startedAt: practice.startedAt,
        completedAt: practice.completedAt,

        timeSpent: practice.timeSpent ?? 0,
      },

      summary: {
        total,
        answered,
        unanswered,
        correct,
        incorrect,
        accuracy,
      },

      timeStats: {
        totalQuestionTime,
        averageTimePerQuestion,
        averageTimeAnswered,
      },

      difficulty: difficultyStats,

      domains,

      subtopics,

      questions,
    });
  } catch (error) {
    console.error("Report error:", error);

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Failed to load practice report",
      },
      { status: 500 },
    );
  }
}
