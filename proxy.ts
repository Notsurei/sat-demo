import { NextRequest, NextResponse } from "next/server";
import { verify, decode } from "jsonwebtoken";
import { prisma } from "@/app/api/util/prisma";

const PUBLIC_ROUTES = [
  "/api/auth/signin",
  "/api/auth/signup",
  "/api/auth/logout",
  "/api/auth/check-auth",
  "/api/auth/verify-email",
  "/api/auth/resend-verification",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
];

export default async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  try {
    const cookieToken = req.cookies.get("token")?.value;

    const authorization = req.headers.get("authorization");

    const bearerToken = authorization?.startsWith("Bearer ")
      ? authorization.substring(7).trim()
      : undefined;
    const token = bearerToken || cookieToken;

    if (!token) {

      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const JWT_SECRET = process.env.JWT_SECRET;

    if (!JWT_SECRET) {
      throw new Error("JWT_SECRET is missing");
    }

    const decoded = verify(token, JWT_SECRET) as {
      id?: string;
      userId?: string;
      email?: string;
      role?: string;
      plan?: string;
    };
    const userId = decoded.userId || decoded.id;

    if (!userId) {
      throw new Error("Token payload does not contain userId");
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        email: true,
        role: true,
        subscriptionPlan: true,
        isVerified: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 401 },
      );
    }

    if (!user.isVerified) {
      return NextResponse.json(
        {
          success: false,
          error: "Email not verified",
        },
        { status: 403 },
      );
    }

    const requestHeaders = new Headers(req.headers);

    requestHeaders.set("x-user-id", user.id);
    requestHeaders.set("x-user-email", user.email);
    requestHeaders.set("x-user-role", user.role);
    requestHeaders.set("x-user-plan", user.subscriptionPlan);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error("❌ PROXY AUTH ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Invalid token",
      },
      { status: 401 },
    );
  }
}

export const config = {
  matcher: ["/api/:path*"],
};
