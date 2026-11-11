import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { z } from "zod";

import { prisma } from "../../util/prisma";

const SignInSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(200),
});

const SESSION_TTL_MS = 1000 * 60 * 60 * 24;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const parsed = SignInSchema.safeParse(body);
    if (!parsed.success) {
      console.log("[SignIn] Zod validation failed:", parsed.error.flatten());
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    console.log("[SignIn] Password valid:", isValid);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    if (!user.isVerified) {
      console.log("[SignIn] Email not verified:", user.email);
      return NextResponse.json(
        {
          success: false,
          error: "Email not verified",
          code: "EMAIL_NOT_VERIFIED",
        },
        { status: 403 },
      );
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error("[SignIn] JWT_SECRET is missing");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    const now = new Date();

    const revoked = await prisma.userSession.updateMany({
      where: {
        userId: user.id,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      data: {
        revokedAt: now,
        revokedReason: "NEW_LOGIN",
      },
    });

    const userAgent = request.headers.get("user-agent") ?? null;
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const ipAddress = forwardedFor?.split(",")[0]?.trim() || realIp || null;

    const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);

    const session = await prisma.userSession.create({
      data: {
        userId: user.id,
        userAgent,
        ipAddress,
        expiresAt,
      },
      select: { id: true },
    });

    const token = jwt.sign(
      {
        userId: user.id,
        sessionId: session.id,
        //  role: user.role,
      },
      JWT_SECRET,
      {
        expiresIn: "1d",
        algorithm: "HS256",
      },
    );

    const response = NextResponse.json({
      success: true,
      message: "Sign-in successful",
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        subscriptionPlan: user.subscriptionPlan,
        isVerified: user.isVerified,
      },
      // ...(process.env.NODE_ENV !== "production" && {
      //   debug: {
      //     token,
      //     expiresAt: expiresAt.toISOString(),
      //     sessionId: session.id,
      //   },
      // }),
    });

    response.cookies.set("__Host-auth_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error) {
    console.error("[SignIn] Error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
