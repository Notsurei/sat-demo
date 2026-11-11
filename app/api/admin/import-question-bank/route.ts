"use server";

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  requireAdmin,
  ForbiddenError,
  UnauthorizedError,
} from "../../util/permission";
import { getUserFromRequest } from "../../util/auth";
import { prisma } from "../../util/prisma";
import { z, ZodError } from "zod";
import type { BankPurpose, Difficulty } from "@prisma/client";

// ===== SCHEMA =====
const BankPurposeEnum = z.enum(["PRACTICE", "FULL_TEST", "MIXED"]);
const DifficultyEnum = z.enum(["EASY", "MEDIUM", "HARD"]);

const ImportBankSchema = z.object({
  title: z.string().trim().min(1).max(200),
  version: z.string().trim().max(50).optional(),
  description: z.string().trim().max(5000).optional(),
  purpose: BankPurposeEnum.optional().default("MIXED"),
  sections: z
    .array(
      z.object({
        key: z.string().trim().min(1).max(100),
        title: z.string().trim().max(200).optional(),
        subject: z.enum(["SAT_MATH", "SAT_RW"]).optional(),
        order: z.number().int().nonnegative().max(10000),
        modules: z
          .array(
            z.object({
              key: z.string().trim().min(1).max(100),
              title: z.string().trim().max(200).optional(),
              passage: z.string().max(100_000).nullable().optional(),
              imageUrl: z.string().url().max(2048).optional(),
              audioUrl: z.string().url().max(2048).optional(),
              order: z.number().int().nonnegative().max(10000),
              difficulty: DifficultyEnum.nullable().optional(),
              questions: z
                .array(
                  z.object({
                    externalId: z.string().trim().max(200).optional(),
                    prompt: z.string().max(50_000),
                    passage: z.string().max(100_000).nullable().optional(),
                    domain: z.string().trim().max(200).optional(),
                    subtopic: z.string().trim().max(200).optional(),
                    difficulty: DifficultyEnum,
                    type: z.enum(["MCQ", "GRID_IN"]),
                    correctAnswer: z.string().max(100).optional(),
                    correctTextAnswer: z.string().max(1000).optional(),
                    explanation: z.string().max(50_000).optional(),
                    order: z.number().int().nonnegative().max(10000),
                    options: z
                      .array(
                        z.object({
                          label: z.string().trim().max(20),
                          content: z.string().max(50_000),
                          isCorrect: z.boolean(),
                        }),
                      )
                      .max(10),
                  }),
                )
                .max(5000),
            }),
          )
          .max(100),
      }),
    )
    .max(20),
});

type ParsedBank = z.infer<typeof ImportBankSchema>;

// ===== HELPERS =====

const normalizeLabel = (v: unknown): string =>
  String(v ?? "")
    .trim()
    .toUpperCase()
    .replace(/[.)\]:]\s*$/, "");

const MCQ_TYPES = new Set([
  "mcq",
  "multiplechoice",
  "multiple",
  "multiplechoicequestion",
]);
const GRID_IN_TYPES = new Set([
  "gridin",
  "spr",
  "numeric",
  "grid",
  "studentproducedresponse",
  "studentresponse",
]);

// ✅ Detect type từ field `type` + infer từ options (fix bank 1 thiếu type)
const detectType = (q: any): "MCQ" | "GRID_IN" => {
  const raw = String(q.type ?? "")
    .toLowerCase()
    .replace(/[_\-\s]/g, "");
  if (MCQ_TYPES.has(raw)) return "MCQ";
  if (GRID_IN_TYPES.has(raw)) return "GRID_IN";

  const hasOptionsObj =
    q.options &&
    typeof q.options === "object" &&
    !Array.isArray(q.options) &&
    Object.keys(q.options).length > 0;
  const hasOptionsArr = Array.isArray(q.options) && q.options.length > 0;
  if (hasOptionsObj || hasOptionsArr) return "MCQ";

  return "GRID_IN";
};

// ✅ Extract options — hỗ trợ object + array + fallback match label
const extractOptions = (q: any, type: "MCQ" | "GRID_IN") => {
  if (type !== "MCQ") return [];
  const raw = q.options;
  if (!raw) return [];

  const correctLabel = normalizeLabel(q.correctAnswer);

  // Object format: { A: "content", B: "content" }
  if (typeof raw === "object" && !Array.isArray(raw)) {
    const opts = Object.entries(raw).map(([label, content]) => ({
      label,
      content: String(content),
      isCorrect: correctLabel !== "" && normalizeLabel(label) === correctLabel,
    }));

    if (!opts.some((o) => o.isCorrect) && correctLabel !== "") {
      console.warn(
        `[import] MCQ ${q.id ?? "?"} no matching label. correctAnswer="${q.correctAnswer}", labels=[${opts.map((o) => o.label).join(",")}]`,
      );
    }

    return opts;
  }

  // Array format
  if (Array.isArray(raw)) {
    let opts = raw.map((opt: any) => ({
      label: String(opt.label ?? ""),
      content: String(opt.content ?? ""),
      isCorrect: opt.isCorrect === true,
    }));

    if (!opts.some((o) => o.isCorrect) && correctLabel !== "") {
      opts = opts.map((o) => ({
        ...o,
        isCorrect: normalizeLabel(o.label) === correctLabel,
      }));
    }

    return opts;
  }

  return [];
};

// ✅ Extract answer — MCQ lấy label, GRID_IN lấy text (fix bank 2 `spr`)
const extractAnswers = (q: any, type: "MCQ" | "GRID_IN") => {
  if (type === "MCQ") {
    if (q.correctAnswer !== undefined && q.correctAnswer !== null) {
      return { correctAnswer: String(q.correctAnswer) };
    }
    return {};
  }

  // GRID_IN: bank 2 dùng `correctAnswer` cho "spr", bank 3 dùng `correctTextAnswer`
  const candidates = [
    q.correctTextAnswer,
    q.correctAnswer,
    q.answer,
    q.correct,
    q.value,
    q.solution,
  ];

  for (const c of candidates) {
    if (c === null || c === undefined) continue;
    const s = String(c).trim();
    if (s !== "") {
      return { correctTextAnswer: s, correctAnswer: s };
    }
  }

  return {};
};

// ✅ Extract passage — ưu tiên `passage`, fallback `text` (bank 1 & 2)
const extractPassage = (q: any): string | null => {
  if (typeof q.passage === "string" && q.passage.trim().length > 0) {
    return q.passage;
  }
  if (typeof q.text === "string" && q.text.trim().length > 0) {
    return q.text;
  }
  return null;
};

// ✅ Prefer FIXED versions — nếu có "B13-M2-H-01" và "B13-M2-H-01-FIXED" → giữ FIXED
const FIXED_SUFFIX = "-FIXED";

const preferFixedVersions = (
  questions: any[],
): { kept: any[]; droppedIds: string[] } => {
  const groups = new Map<string, any[]>();

  // ✅ for...of trên array OK
  for (const q of questions) {
    const id = String(q.externalId ?? q.id ?? "");
    const baseId = id.endsWith(FIXED_SUFFIX)
      ? id.slice(0, -FIXED_SUFFIX.length)
      : id;
    const existing = groups.get(baseId);
    if (existing) {
      existing.push(q);
    } else {
      groups.set(baseId, [q]);
    }
  }

  const kept: any[] = [];
  const droppedIds: string[] = [];

  // ✅ FIX: Dùng Array.from thay vì for...of trên Map
  const entries = Array.from(groups.entries());

  // ✅ FIX: Dùng forEach thay vì for...of để tránh destructure Map
  entries.forEach(([baseId, group]) => {
    if (group.length === 1) {
      kept.push(group[0]);
      return;
    }

    // ✅ FIX: Thêm `: any` cho callback parameter
    const fixed = group.find((item: any) =>
      String(item.externalId ?? item.id ?? "").endsWith(FIXED_SUFFIX),
    );
    const chosen = fixed ?? group[0];

    if (fixed) {
      console.log(
        `[import] Prefer FIXED for ${baseId}: ${fixed.externalId ?? fixed.id} (dropped ${group.length - 1} superseded)`,
      );
    } else {
      console.warn(
        `[import] Duplicate IDs without FIXED marker: ${baseId} (${group.length} items)`,
      );
    }

    kept.push(chosen);
    group.forEach((q: any) => {
      if (q !== chosen) {
        droppedIds.push(String(q.externalId ?? q.id ?? ""));
      }
    });
  });

  return { kept, droppedIds };
};

function transformLegacyFormat(raw: any): ParsedBank {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Invalid legacy format");
  }

  const { metadata, sections } = raw as {
    metadata?: Record<string, any>;
    sections?: Record<string, any>;
  };

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

  const rawTitle =
    (typeof metadata?.title === "string" && metadata.title.trim()) ||
    (typeof metadata?.version === "string" && metadata.version.trim()) ||
    `Imported Bank ${new Date().toISOString().slice(0, 10)}`;
  const title = String(rawTitle).slice(0, 200);

  const transformedSections = Object.entries(sections || {}).map(
    ([key, data]: [string, any], sectionIndex) => {
      const subject = subjectMap[key] || "SAT_MATH";
      const isRwSection = subject === "SAT_RW";
      const modulesData: Record<string, any> = data || {};

      const modules = Object.entries(modulesData).map(
        ([modKey, questions], moduleIndex) => {
          const qs: any[] = Array.isArray(questions) ? questions : [];

          // Module-level passage: chỉ dùng cho RW, ưu tiên `text` đầu tiên
          const modulePassage = isRwSection
            ? (qs.find(
                (q: any) =>
                  typeof q.text === "string" && q.text.trim().length > 0,
              )?.text ?? null)
            : null;

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
              // ✅ Detect type với inference
              const type = detectType(question);

              // ✅ Extract options và answers
              const options = extractOptions(question, type);
              const { correctAnswer, correctTextAnswer } = extractAnswers(
                question,
                type,
              );

              // ✅ Passage: ưu tiên field riêng, fallback module passage (chỉ RW)
              const ownPassage = extractPassage(question);
              const passage = ownPassage ?? modulePassage;

              // ✅ Difficulty: module → question.level → question.difficulty → id
              let difficulty: Difficulty = moduleDifficulty ?? "MEDIUM";

              if (question.level) {
                const levelMap: Record<string, Difficulty> = {
                  easy: "EASY",
                  medium: "MEDIUM",
                  hard: "HARD",
                  "2026 advanced": "HARD",
                  "2026 easy": "EASY",
                  "2026 medium": "MEDIUM",
                  advanced: "HARD",
                };
                const levelKey =
                  typeof question.level === "string"
                    ? question.level.toLowerCase().trim()
                    : "";
                if (levelMap[levelKey]) difficulty = levelMap[levelKey];
              } else if (question.difficulty) {
                const d = String(question.difficulty).toUpperCase();
                if (d === "EASY" || d === "MEDIUM" || d === "HARD") {
                  difficulty = d as Difficulty;
                }
              } else {
                const id = String(question.id || "").toLowerCase();
                if (id.includes("_easy")) difficulty = "EASY";
                else if (id.includes("_hard") || id.includes("_advanced"))
                  difficulty = "HARD";
              }

              const prompt =
                typeof question.prompt === "string" ? question.prompt : "";

              const externalId =
                question.id || `${key}-${modKey}-${questionIndex + 1}`;

              // ✅ Warning: math question nằm trong rw section
              if (isRwSection && /^math[_-]/i.test(externalId)) {
                console.warn(
                  `[import] Question "${externalId}" looks like a MATH question but is in RW section "${key}/${modKey}"`,
                );
              }

              return {
                externalId,
                prompt,
                passage,
                domain: question.domain || "General",
                subtopic: question.subtopic || "General",
                difficulty,
                type,
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
    title,
    version: typeof metadata?.version === "string" ? metadata.version : "1.0.0",
    description:
      typeof metadata?.description === "string" ? metadata.description : "",
    purpose,
    sections: transformedSections,
  } as ParsedBank;
}

// ===== POST =====

export async function POST(req: NextRequest) {
  try {
    const MAX_SIZE = 5 * 1024 * 1024;
    const contentLength = Number(req.headers.get("content-length") ?? 0);

    if (Number.isFinite(contentLength) && contentLength > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: "Payload too large (max 5MB)" },
        { status: 413 },
      );
    }

    const user = getUserFromRequest(req);
    requireAdmin(user.role);

    const body = await req.json();

    // ✅ Log metadata trước khi transform để debug
    console.log("[import] ─── BANK METADATA ───", {
      title: body?.metadata?.title,
      version: body?.metadata?.version,
      purpose: body?.metadata?.purpose,
      sections: Object.keys(body?.sections ?? {}),
    });

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

      console.log("[import] Using legacy transform");
      const transformed = transformLegacyFormat(body);
      parsed = ImportBankSchema.parse(transformed);
    }

    // ✅ Prefer FIXED versions (chỉ có tác dụng với bank 3)
    let preferFixedDropped = 0;
    const preferFixedDroppedIds: string[] = [];
    for (const section of parsed.sections) {
      for (const module of section.modules) {
        const { kept, droppedIds } = preferFixedVersions(module.questions);
        module.questions = kept;
        preferFixedDropped += droppedIds.length;
        preferFixedDroppedIds.push(...droppedIds);
      }
    }

    if (preferFixedDropped > 0) {
      console.log(
        `[import] Prefer fixed: dropped ${preferFixedDropped} superseded questions`,
      );
    }

    // ✅ Deduplicate externalIds
    const allExternalIds: string[] = [];
    for (const section of parsed.sections) {
      for (const module of section.modules) {
        for (const question of module.questions) {
          if (question.externalId) allExternalIds.push(question.externalId);
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

        return { ...section, modules: filteredModules };
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
          preferFixedDropped,
          message: "All questions already exist in the database",
        },
        { status: 409 },
      );
    }

    // ✅ Missing answer check
    const missingAnswer: Array<{
      externalId: string;
      type: string;
      hasOptions: number;
      hasCorrectOption: boolean;
      correctAnswer?: string;
      correctTextAnswer?: string;
    }> = [];

    const typeBreakdown = { MCQ: 0, GRID_IN: 0 };

    for (const section of filteredSections) {
      for (const module of section.modules) {
        for (const question of module.questions) {
          typeBreakdown[question.type]++;

          const optCount = question.options?.length ?? 0;
          const hasCorrectOpt =
            question.options?.some((o) => o.isCorrect) ?? false;

          const missing =
            question.type === "MCQ"
              ? !hasCorrectOpt &&
                (question.correctAnswer === undefined ||
                  String(question.correctAnswer).trim() === "")
              : !question.correctTextAnswer &&
                (question.correctAnswer === undefined ||
                  String(question.correctAnswer).trim() === "");

          if (missing) {
            missingAnswer.push({
              externalId: question.externalId ?? "(no-id)",
              type: question.type,
              hasOptions: optCount,
              hasCorrectOption: hasCorrectOpt,
              correctAnswer: question.correctAnswer,
              correctTextAnswer: question.correctTextAnswer,
            });
          }
        }
      }
    }

    if (missingAnswer.length > 0) {
      console.warn(
        `[import] ⚠️ ${missingAnswer.length} câu thiếu answer:`,
        missingAnswer,
      );
    }

    const purpose = (parsed.purpose ?? "MIXED") as BankPurpose;

    // ✅ Batch insert (giữ nguyên để tránh P2028)
    const bank = await prisma.$transaction(
      async (tx) => {
        const newBank = await tx.questionBank.create({
          data: {
            title: parsed.title,
            version: parsed.version,
            description: parsed.description,
            generatedAt: new Date(),
            totalQuestions,
            purpose,
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

        const sectionIds: string[] = [];
        for (let si = 0; si < filteredSections.length; si++) {
          const s = filteredSections[si];
          const created = await tx.questionBankSection.create({
            data: {
              bankId: newBank.id,
              key: s.key,
              title: s.title,
              subject: s.subject,
              order: si + 1,
            },
            select: { id: true },
          });
          sectionIds.push(created.id);
        }

        const moduleIdMatrix: string[][] = [];
        for (let si = 0; si < filteredSections.length; si++) {
          const s = filteredSections[si];
          moduleIdMatrix[si] = [];
          for (let mi = 0; mi < s.modules.length; mi++) {
            const m = s.modules[mi];
            const created = await tx.questionBankModule.create({
              data: {
                sectionId: sectionIds[si],
                key: m.key,
                title: m.title,
                passage: m.passage,
                imageUrl: m.imageUrl,
                audioUrl: m.audioUrl,
                order: mi + 1,
                difficulty: m.difficulty ?? null,
              },
              select: { id: true },
            });
            moduleIdMatrix[si][mi] = created.id;
          }
        }

        const questionRows: Array<{
          id: string;
          bankModuleId: string;
          externalId: string | null;
          prompt: string;
          passage: string | null;
          domain: string | null;
          subtopic: string | null;
          difficulty: Difficulty;
          type: "MCQ" | "GRID_IN";
          correctAnswer: string | null;
          correctTextAnswer: string | null;
          explanation: string | null;
          order: number;
          bankPurpose: BankPurpose;
        }> = [];

        const optionRows: Array<{
          questionId: string;
          label: string;
          content: string;
          isCorrect: boolean;
        }> = [];

        for (let si = 0; si < filteredSections.length; si++) {
          const section = filteredSections[si];
          for (let mi = 0; mi < section.modules.length; mi++) {
            const module = section.modules[mi];
            const bankModuleId = moduleIdMatrix[si][mi];
            for (let qi = 0; qi < module.questions.length; qi++) {
              const q = module.questions[qi];
              const questionId = randomUUID();
              questionRows.push({
                id: questionId,
                bankModuleId,
                externalId: q.externalId ?? null,
                prompt: q.prompt,
                passage: q.passage ?? null,
                domain: q.domain ?? null,
                subtopic: q.subtopic ?? null,
                difficulty: q.difficulty,
                type: q.type,
                correctAnswer: q.correctAnswer ?? null,
                correctTextAnswer: q.correctTextAnswer ?? null,
                explanation: q.explanation ?? null,
                order: qi + 1,
                bankPurpose: purpose,
              });
              for (const opt of q.options) {
                optionRows.push({
                  questionId,
                  label: opt.label,
                  content: opt.content,
                  isCorrect: opt.isCorrect,
                });
              }
            }
          }
        }

        const Q_BATCH = 500;
        for (let i = 0; i < questionRows.length; i += Q_BATCH) {
          await tx.question.createMany({
            data: questionRows.slice(i, i + Q_BATCH),
          });
          console.log(
            `[import] questions ${Math.min(i + Q_BATCH, questionRows.length)}/${questionRows.length}`,
          );
        }

        const O_BATCH = 1000;
        for (let i = 0; i < optionRows.length; i += O_BATCH) {
          await tx.option.createMany({
            data: optionRows.slice(i, i + O_BATCH),
          });
          console.log(
            `[import] options ${Math.min(i + O_BATCH, optionRows.length)}/${optionRows.length}`,
          );
        }

        return newBank;
      },
      {
        timeout: 120_000,
        maxWait: 20_000,
      },
    );

    return NextResponse.json(
      {
        success: true,
        message: "Question bank imported successfully",
        bank,
        summary: {
          imported: totalQuestions,
          skippedExisting,
          skippedDuplicate,
          preferFixedDropped,
          originalTotal: allExternalIds.length,
          purpose,
          typeBreakdown,
          missingAnswer: missingAnswer.length,
        },
        ...(process.env.NODE_ENV !== "production" && {
          ...(preferFixedDroppedIds.length > 0 && {
            preferFixedDroppedSamples: preferFixedDroppedIds.slice(0, 20),
          }),
          ...(missingAnswer.length > 0 && {
            missingAnswerSamples: missingAnswer.slice(0, 50),
          }),
        }),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("❌ IMPORT ERROR:", error);

    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    if (error instanceof ZodError) {
      console.error("[ImportBank] Zod issues:", error.issues);
      const isDev = process.env.NODE_ENV !== "production";
      return NextResponse.json(
        {
          success: false,
          error: "Invalid import data format",
          ...(isDev && { issues: error.issues }),
        },
        { status: 400 },
      );
    }

    console.error("[ImportBank] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to import question bank. Please try again.",
      },
      { status: 500 },
    );
  }
}
