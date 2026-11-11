import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/app/api/util/prisma";

function redirectWithStatus(request: NextRequest, status: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.url;
  const url = new URL("/pages/verify-email", appUrl);
  url.searchParams.set("status", status);

  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");

    if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
      return redirectWithStatus(request, "invalid");
    }

    const tokenHash = createHash("sha256").update(token).digest("hex");

    const user = await prisma.user.findFirst({
      where: {
        verifyToken: tokenHash,
      },
      select: {
        id: true,
        isVerified: true,
        verifyTokenExpiry: true,
      },
    });

    if (!user) {
      return redirectWithStatus(request, "invalid");
    }

    if (user.isVerified) {
      return redirectWithStatus(request, "already");
    }

    const now = new Date();

    if (!user.verifyTokenExpiry || user.verifyTokenExpiry <= now) {
      return redirectWithStatus(request, "expired");
    }

    const result = await prisma.user.updateMany({
      where: {
        id: user.id,
        verifyToken: tokenHash,
        verifyTokenExpiry: {
          gt: now,
        },
        isVerified: false,
      },
      data: {
        isVerified: true,
        verifyToken: null,
        verifyTokenExpiry: null,
      },
    });

    if (result.count !== 1) {
      return redirectWithStatus(request, "invalid");
    }

    return redirectWithStatus(request, "success");
  } catch (error) {
    console.error("[VerifyEmail] Unexpected error:", error);

    return NextResponse.json(
      { error: "Verification failed. Please try again." },
      { status: 500 },
    );
  }
}
