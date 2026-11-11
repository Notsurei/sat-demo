import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/app/api/util/prisma";
import { sendVerificationEmail } from "../../util/send-verification";

const ResendVerificationSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 },
      );
    }

    const parsed = ResendVerificationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid email" },
        { status: 400 },
      );
    }

    const { email } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, firstName: true, isVerified: true },
    });

    if (!user || user.isVerified) {
      return NextResponse.json({
        success: true,
        message:
          "If an account exists and needs verification, an email was sent.",
      });
    }

    const appUrl = new URL(request.url).origin;

    try {
      await sendVerificationEmail({
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        appUrl,
      });
    } catch (emailError) {
      console.error("[ResendVerification] Mail failed:", emailError);
      return NextResponse.json(
        { success: false, error: "Could not send email. Please try again." },
        { status: 503 },
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "If an account exists and needs verification, an email was sent.",
    });
  } catch (error) {
    console.error("[ResendVerification] Error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
