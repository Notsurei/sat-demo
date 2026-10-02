import { NextRequest, NextResponse } from "next/server";
import {
  requireAdmin,
  ForbiddenError,
  UnauthorizedError,
} from "../../util/permission";
import { getUserFromRequest } from "../../util/auth";
import { prisma } from "../../util/prisma";
import { z, ZodError } from "zod";
import type { BankPurpose, Difficulty } from "@prisma/client";

const BankPurposeEnum = z.enum(["PRACTICE", "FULL_TEST", "MIXED"]);
const DifficultyEnum = z.enum(["EASY", "MEDIUM", "HARD"]);

const ImportBankSchema = z.object({
  title: z.string().min(1),
  version: z.string().optional(),
  description: z.string().optional(),

  purpose: BankPurposeEnum.optional().default("MIXED"),

  sections: z.array(
    z.object({
      key: z.string(),
      title: z.string().optional(),
      subject: z.enum(["SAT_MATH", "SAT_RW"]).optional(),
      order: z.number(),

      modules: z.array(
        z.object({
          key: z.string(),
          title: z.string().optional(),
          passage: z.string().nullable().optional(),
          imageUrl: z.string().optional(),
          audioUrl: z.string().optional(),
          order: z.number(),

          difficulty: DifficultyEnum.nullable().optional(),

          questions: z.array(
            z.object({
              externalId: z.string().optional(),
              prompt: z.string(),
              passage: z.string().nullable().optional(),
              domain: z.string().optional(),
              subtopic: z.string().optional(),
              difficulty: DifficultyEnum,
              type: z.enum(["MCQ", "GRID_IN"]),
              correctAnswer: z.string().optional(),
              correctTextAnswer: z.string().optional(),
              explanation: z.string().optional(),
              order: z.number(),

              options: z.array(
                z.object({
                  label: z.string(),
                  content: z.string(),
                  isCorrect: z.boolean(),
                }),
              ),
            }),
          ),
        }),
      ),
    }),
  ),
});

type ParsedBank = z.infer<typeof ImportBankSchema>;

function transformLegacyFormat(raw: any) {
  const { metadata, sections } = raw;

  const subjectMap: Record<string, "SAT_MATH" | "SAT_RW"> = {
    math: "SAT_MATH",
    rw: "SAT_RW",
  };

  const purposeRaw = String(metadata?.purpose ?? "").toUpperCase();
  const purpose: BankPurpose = ["PRACTICE", "FULL_TEST", "MIXED"].includes(
    purposeRaw,
  )
    ? (purposeRaw as BankPurpose)
    : "MIXED";

  const transformedSections = Object.entries(sections || {}).map(
    ([key, data]: [string, any], sectionIndex) => {
      const subject = subjectMap[key] || "SAT_MATH";
      const modulesData: Record<string, any> = data || {};

      const modules = Object.entries(modulesData).map(
        ([modKey, questions], moduleIndex) => {
          const qs: any[] = Array.isArray(questions) ? questions : [];

          const modulePassage =
            qs.find(
              (q: any) =>
                typeof q.text === "string" && q.text.trim().length > 0,
            )?.text ?? null;

          // 👇 Detect difficulty của module từ modKey
          const modKeyLower = modKey.toLowerCase();
          let moduleDifficulty: Difficulty | null = null;

          if (modKeyLower.includes("easy")) moduleDifficulty = "EASY";
          else if (modKeyLower.includes("hard")) moduleDifficulty = "HARD";
          else if (modKeyLower.includes("medium")) moduleDifficulty = "MEDIUM";
          else if (modKeyLower.includes("advanced")) moduleDifficulty = "HARD";

          return {
            key: modKey,
            title: `Module ${modKey
              .replace(/^m/, "")
              .replace("_easy", " Easy")
              .replace("_hard", " Hard")}`,
            order: moduleIndex + 1,
            passage: modulePassage,
            difficulty: moduleDifficulty,

            questions: qs.map((question: any, questionIndex: number) => {
              const isMCQ =
                question.type === "mcq" || question.type === "MCQ";
              const isGridIn =
                question.type === "grid-in" ||
                question.type === "GRID_IN" ||
                question.type === "spr" ||
                question.type === "SPR";

              let options: {
                label: string;
                content: string;
                isCorrect: boolean;
              }[] = [];

              let correctAnswer: string | undefined;
              let correctTextAnswer: string | undefined;

              if (
                isMCQ &&
                question.options &&
                typeof question.options === "object" &&
                !Array.isArray(question.options)
              ) {
                options = Object.entries(question.options).map(
                  ([label, content]) => ({
                    label,
                    content: String(content),
                    isCorrect: label === question.correctAnswer,
                  }),
                );
                correctAnswer = question.correctAnswer;
              } else if (isMCQ && Array.isArray(question.options)) {
                options = question.options.map((opt: any) => ({
                  label: opt.label,
                  content: opt.content,
                  isCorrect: opt.isCorrect || false,
                }));
                const correctOpt = options.find((o) => o.isCorrect);
                correctAnswer = correctOpt?.label;
              }

              if (isGridIn) {
                correctTextAnswer =
                  question.correctTextAnswer || question.correctAnswer;
              }

              // Difficulty per-question
              let difficulty: Difficulty = moduleDifficulty ?? "MEDIUM";

              if (question.level) {
                const levelMap: Record<string, Difficulty> = {
                  easy: "EASY",
                  medium: "MEDIUM",
                  hard: "HARD",
                  "2026 advanced": "HARD",
                  advanced: "HARD",
                };
                const levelKey =
                  typeof question.level === "string"
                    ? question.level.toLowerCase()
                    : "";
                if (levelMap[levelKey]) difficulty = levelMap[levelKey];
              } else {
                const id = String(question.id || "").toLowerCase();
                if (id.includes("easy")) difficulty = "EASY";
                else if (id.includes("hard") || id.includes("advanced"))
                  difficulty = "HARD";
              }

              const prompt =
                typeof question.prompt === "string" ? question.prompt : "";

              let passage: string | null = null;
              if (
                typeof question.passage === "string" &&
                question.passage.trim().length > 0
              ) {
                passage = question.passage;
              } else if (
                typeof question.text === "string" &&
                question.text.trim().length > 0
              ) {
                passage = question.text;
              } else {
                passage = modulePassage;
              }

              return {
                externalId:
                  question.id || `${key}-${modKey}-${questionIndex + 1}`,
                prompt,
                passage,
                domain: question.domain || "General",
                subtopic: question.subtopic || "General",
                difficulty,
                type: isMCQ ? "MCQ" : "GRID_IN",
                correctAnswer,
                correctTextAnswer,
                explanation: question.explanation || "",
                order: questionIndex + 1,
                options,
              };
            }),
          };
        },
      );

      return {
        key,
        title: key === "math" ? "Math" : "Reading & Writing",
        subject,
        order: sectionIndex + 1,
        modules,
      };
    },
  );

  return {
    title: metadata?.title || "Imported Question Bank",
    version: metadata?.version || "1.0.0",
    description: metadata?.description || "",
    purpose,
    sections: transformedSections,
  };
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    requireAdmin(user.role);

    const body = await req.json();

    let parsed: ParsedBank;

    try {
      parsed = ImportBankSchema.parse(body);
    } catch (firstError) {
      const isLegacyFormat =
        body?.metadata &&
        body?.sections &&
        typeof body.sections === "object" &&
        !Array.isArray(body.sections);

      if (!isLegacyFormat) {
        throw firstError;
      }

      const transformed = transformLegacyFormat(body);
      parsed = ImportBankSchema.parse(transformed);
    }

    const allExternalIds: string[] = [];

    for (const section of parsed.sections) {
      for (const module of section.modules) {
        for (const question of module.questions) {
          if (question.externalId) {
            allExternalIds.push(question.externalId);
          }
        }
      }
    }

    const existingQuestions =
      allExternalIds.length > 0
        ? await prisma.question.findMany({
            where: { externalId: { in: allExternalIds } },
            select: { externalId: true },
          })
        : [];

    const existingIds = new Set(
      existingQuestions
        .map((q) => q.externalId)
        .filter((id): id is string => typeof id === "string"),
    );

    const seenIds = new Set<string>();
    let skippedExisting = 0;
    let skippedDuplicate = 0;

    const filteredSections = parsed.sections
      .map((section) => {
        const filteredModules = section.modules
          .map((module) => {
            const filteredQuestions = module.questions.filter((question) => {
              const externalId = question.externalId;

              if (!externalId) return true;

              if (existingIds.has(externalId)) {
                skippedExisting++;
                return false;
              }

              if (seenIds.has(externalId)) {
                skippedDuplicate++;
                return false;
              }

              seenIds.add(externalId);
              return true;
            });

            if (filteredQuestions.length === 0) return null;

            return {
              ...module,
              questions: filteredQuestions.map((question, questionIndex) => ({
                ...question,
                order: questionIndex + 1,
              })),
            };
          })
          .filter(
            (module): module is NonNullable<typeof module> => module !== null,
          );

        if (filteredModules.length === 0) return null;

        return {
          ...section,
          modules: filteredModules,
        };
      })
      .filter(
        (section): section is NonNullable<typeof section> => section !== null,
      );

    const totalQuestions = filteredSections.reduce(
      (total, section) =>
        total +
        section.modules.reduce(
          (moduleTotal, module) => moduleTotal + module.questions.length,
          0,
        ),
      0,
    );

    if (totalQuestions === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No new questions to import",
          skippedExisting,
          skippedDuplicate,
          message: "All questions already exist in the database",
        },
        { status: 409 },
      );
    }

    const purpose = (parsed.purpose ?? "MIXED") as BankPurpose;

    const bank = await prisma.questionBank.create({
      data: {
        title: parsed.title,
        version: parsed.version,
        description: parsed.description,
        generatedAt: new Date(),
        totalQuestions,
        purpose,

        sections: {
          create: filteredSections.map((section, sectionIndex) => ({
            key: section.key,
            title: section.title,
            subject: section.subject,
            order: sectionIndex + 1,

            modules: {
              create: section.modules.map((module, moduleIndex) => ({
                key: module.key,
                title: module.title,
                passage: module.passage,
                imageUrl: module.imageUrl,
                audioUrl: module.audioUrl,
                order: moduleIndex + 1,

                // 👇 Gán difficulty cho module
                difficulty: module.difficulty ?? null,

                questions: {
                  create: module.questions.map(
                    (question, questionIndex) => ({
                      externalId: question.externalId,
                      prompt: question.prompt,
                      passage: question.passage,
                      domain: question.domain,
                      subtopic: question.subtopic,
                      difficulty: question.difficulty,
                      type: question.type,
                      correctAnswer: question.correctAnswer,
                      correctTextAnswer: question.correctTextAnswer,
                      explanation: question.explanation,
                      order: questionIndex + 1,

                      // 👇 Denormalize purpose cho Question
                      bankPurpose: purpose,

                      options: {
                        create: question.options.map((option) => ({
                          label: option.label,
                          content: option.content,
                          isCorrect: option.isCorrect,
                        })),
                      },
                    }),
                  ),
                },
              })),
            },
          })),
        },
      },

      select: {
        id: true,
        title: true,
        version: true,
        purpose: true,
        totalQuestions: true,
        generatedAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Question bank imported successfully",
        bank,
        summary: {
          imported: totalQuestions,
          skippedExisting,
          skippedDuplicate,
          originalTotal: allExternalIds.length,
          purpose,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("❌ IMPORT ERROR:", error);

    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 },
      );
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 },
      );
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid import data",
          issues: error.issues,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 },
    );
  }
}