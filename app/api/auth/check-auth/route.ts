import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt, { JwtPayload } from "jsonwebtoken";

import { prisma } from "@/app/api/util/prisma";

interface TokenPayload extends JwtPayload {
  id?: string;
  userId?: string;
  email?: string;
  role?: string;
}

export async function GET() {
  try {
    const cookieStore = await cookies();

    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          isAuthenticated: false,
          error: "No token",
        },
        { status: 401 },
      );
    }

    const JWT_SECRET = process.env.JWT_SECRET;

    if (!JWT_SECRET) {
      console.error("❌ JWT_SECRET is missing");

      return NextResponse.json(
        {
          isAuthenticated: false,
          error: "Server configuration error",
        },
        { status: 500 },
      );
    }
    const cleanToken = token.startsWith("Bearer ")
      ? token.slice(7)
      : token;

    const decoded = jwt.verify(
      cleanToken,
      JWT_SECRET,
    ) as TokenPayload;

    const userId = decoded.userId || decoded.id;

    if (!userId) {
      return NextResponse.json(
        {
          isAuthenticated: false,
          error: "Invalid token payload",
        },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        subscriptionPlan: true,
        isVerified: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          isAuthenticated: false,
          error: "User not found",
        },
        { status: 401 },
      );
    }

    if (!user.isVerified) {
      return NextResponse.json(
        {
          isAuthenticated: false,
          error: "Email not verified",
        },
        { status: 403 },
      );
    }

    return NextResponse.json({
      isAuthenticated: true,
      user,
    });
  } catch (error) {

    const errorMessage =
      error instanceof Error ? error.message : "Invalid token";

    return NextResponse.json(
      {
        isAuthenticated: false,
        error: errorMessage,
      },
      { status: 401 },
    );
  }
}