"use server";
import { NextResponse } from "next/server";
import { prisma } from "@/app/api/util/prisma";
import { sendVerificationEmail } from "../../util/send-verification";

import bcrypt from "bcrypt";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const phoneRegex = /^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-]?[\s]?[0-9])+$/;

const SignupSchema = z.object({
  firstName: z.string().trim().min(1).max(50),
  lastName: z.string().trim().min(1).max(50),
  phone: z.string().trim().min(8).max(20).regex(phoneRegex),
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  password: z
    .string()
    .min(8)
    .refine(
      (value) => Buffer.byteLength(value, "utf8") <= 72,
      "Password must not exceed 72 bytes",
    ),
  gender: z.enum(["MALE", "FEMALE", "OTHERS"]),
});

function genericResponse(emailSent = true) {
  return NextResponse.json(
    {
      success: true,
      emailSent,
      message:
        "If this email can be registered, you will receive a verification email.",
    },
    { status: 202 },
  );
}

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const parsed = SignupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid input",
          details: parsed.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    const { firstName, lastName, phone, email, password, gender } = parsed.data;

    const appUrlEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
    if (!appUrlEnv) {
      console.error("[Signup] NEXT_PUBLIC_APP_URL is missing");
      return NextResponse.json(
        { success: false, error: "Server configuration error" },
        { status: 500 },
      );
    }

    let baseUrl: string;
    try {
      const u = new URL(appUrlEnv);
      if (!["http:", "https:"].includes(u.protocol)) {
        throw new Error("Invalid protocol");
      }
      baseUrl = u.origin;
    } catch {
      console.error("[Signup] Invalid NEXT_PUBLIC_APP_URL:", appUrlEnv);
      return NextResponse.json(
        { success: false, error: "Server configuration error" },
        { status: 500 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, isVerified: true },
    });

    if (existingUser?.isVerified) {
      return genericResponse();
    }

    const passwordHash = await bcrypt.hash(password, 12);

    let userId: string;
    try {
      if (existingUser) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            firstName,
            lastName,
            phone,
            passwordHash,
            gender,
          },
        });
        userId = existingUser.id;
      } else {
        const created = await prisma.user.create({
          data: {
            firstName,
            lastName,
            phone,
            email,
            passwordHash,
            gender,
            isVerified: false,
          },
          select: { id: true },
        });
        userId = created.id;
      }
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return genericResponse();
      }
      throw error;
    }

    try {
      await sendVerificationEmail({
        userId,
        email,
        firstName,
        appUrl: baseUrl,
      });
      console.log(`[Signup] Verification email sent to ${email}`);
    } catch (emailError) {
      console.error("[Signup] Email delivery failed:", emailError);
      return NextResponse.json(
        {
          success: true,
          emailSent: false,
          message:
            "Your account was saved, but the verification email could not be sent. Please try signing up again.",
        },
        { status: 202 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        emailSent: true,
        message: "Verification email sent. Please check your inbox.",
      },
      { status: existingUser ? 202 : 201 },
    );
  } catch (error) {
    console.error("[Signup] Error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
