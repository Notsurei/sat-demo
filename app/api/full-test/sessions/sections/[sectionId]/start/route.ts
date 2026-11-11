"use server";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../util/prisma";
import jwt from "jsonwebtoken";

interface JwtPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

/* ─────────────────────────────────────────────────────────────
   AUTH: giống /complete — ưu tiên x-user-id, fallback JWT
   ───────────────────────────────────────────────────────────── */
function getUserIdFromRequest(req: NextRequest): string | null {
  const headerUserId = req.headers.get("x-user-id");
  if (headerUserId) return headerUserId;

  const token = req.cookies.get("token")?.value;
  if (!token) {
    console.warn(
      "[/sections/start] No x-user-id header and no 'token' cookie.",
    );
    return null;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("[/sections/start] JWT_SECRET is not configured");
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
    console.warn("[/sections/start] JWT verify failed:", err);
    return null;
  }
}

interface RouteContext {
  params: Promise<{ sectionId: string }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { sectionId } = await context.params;
    if (!sectionId) {
      return NextResponse.json(
        { success: false, message: "Section ID is required" },
        { status: 400 },
      );
    }

    const sectionSession = await prisma.fullTestSectionSession.findFirst({
      where: {
        id: sectionId,
        fullTestSession: { userId },
      },
      include: {
        fullTestSession: true,
        examSection: true,
      },
    });

    if (!sectionSession) {
      return NextResponse.json(
        { success: false, message: "Section not found" },
        { status: 404 },
      );
    }

    if (sectionSession.status === "COMPLETED") {
      return NextResponse.json(
        { success: false, message: "Section already completed" },
        { status: 409 },
      );
    }

    /* Đã IN_PROGRESS → trả về như bình thường (idempotent) */
    if (sectionSession.status === "IN_PROGRESS") {
      return NextResponse.json({
        success: true,
        message: "Section already in progress",
        data: {
          sectionSessionId: sectionSession.id,
          examSectionId: sectionSession.examSectionId,
          startedAt: sectionSession.startedAt?.toISOString() ?? null,
          durationSeconds: sectionSession.examSection.duration * 60,
        },
      });
    }

    const now = new Date();
    const durationSec = sectionSession.examSection.duration * 60;

    await prisma.$transaction(async (tx) => {
      await tx.fullTestSectionSession.update({
        where: { id: sectionSession.id },
        data: {
          status: "IN_PROGRESS",
          startedAt: sectionSession.startedAt ?? now,
          lastActivityAt: now,
          remainingTime: durationSec,
        },
      });

      await tx.fullTestSession.update({
        where: { id: sectionSession.fullTestSession.id },
        data: {
          status: "IN_PROGRESS",
          currentSectionOrder: sectionSession.examSection.order,
          lastActivityAt: now,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Section started",
      data: {
        sectionSessionId: sectionSession.id,
        examSectionId: sectionSession.examSectionId,
        startedAt: now.toISOString(),
        durationSeconds: durationSec,
      },
    });
  } catch (error) {
    console.error("POST /sections/[sectionId]/start error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to start section" },
      { status: 500 },
    );
  }
}
