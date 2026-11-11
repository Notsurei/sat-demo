import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../util/prisma";
import bcrypt from "bcrypt";
import { z } from "zod";

const ResetPasswordSchema = z.object({
  token: z.string().length(6),
  newPass: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password too long")
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    console.log("=== RESET PASSWORD API CALLED ===");
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const parsed = ResetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { token, newPass } = parsed.data;

    // VERIFY OTP
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token" },
        { status: 400 },
      );
    }

    // STEP 1: OTP is valid, return verification success
    if (!newPass) {
      return NextResponse.json({
        success: true,
        message: "OTP verified successfully",
      });
    }

    // STEP 2: Update password
    const hashedPass = await bcrypt.hash(newPass, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPass,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Password reset successfully. Please sign in again.",
    });
  } catch (error) {
    console.error("[ResetPassword] Error:", error);

    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
