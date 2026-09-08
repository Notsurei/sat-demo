"use server";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/util/prisma";

import jwt from "jsonwebtoken";

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        {
          error: "Token is required",
        },
        {
          status: 400,
        },
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      email: string;
    };

    const user = await prisma.user.findUnique({
      where: {
        email: decoded.email,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: "User not found",
        },
        {
          status: 404,
        },
      );
    }

    if (user.isVerified) {
      return NextResponse.redirect(
        new URL("/?verified=true", request.url),
      );
    }

    await prisma.user.update({
      where: {
        email: decoded.email,
      },
      data: {
        isVerified: true,

        verifyToken: null,
        verifyTokenExpiry: null,
      },
    });

    return NextResponse.redirect(new URL("/signin?verified=true", request.url));
  } catch {
    return NextResponse.json(
      {
        error: "Invalid or expired token",
      },
      {
        status: 400,
      },
    );
  }
}
