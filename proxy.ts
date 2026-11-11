import { NextRequest, NextResponse } from "next/server";
import { verify } from "jsonwebtoken";
import createIntlMiddleware from "next-intl/middleware";

import { prisma } from "@/app/api/util/prisma";
import { routing } from "./i18n/routing";

const PUBLIC_ROUTES = [
  "/api/auth/signin",
  "/api/auth/signup",
  "/api/auth/logout",
  "/api/auth/check-auth",
  "/api/auth/verify-email",
  "/api/auth/resend-verification",
  "/api/auth/forgot-password",
  "/api/auth/email-forgot-password",
  "/api/auth/email-reset-password",
];

const SKIP_MIDDLEWARE_ROUTES = ["/api/admin/import-question-bank"];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );
}

function shouldSkipMiddleware(pathname: string): boolean {
  return SKIP_MIDDLEWARE_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );
}

async function handleApiAuth(req: NextRequest): Promise<NextResponse> {
  const pathname = req.nextUrl.pathname;

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  if (shouldSkipMiddleware(pathname)) {
    return NextResponse.next();
  }

  try {
    const cookieToken = req.cookies.get("__Host-auth_token")?.value;
    const authorization = req.headers.get("authorization");
    const bearerToken = authorization?.startsWith("Bearer ")
      ? authorization.substring(7).trim()
      : undefined;
    const token = bearerToken || cookieToken;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error("❌ MIDDLEWARE CONFIG: JWT_SECRET is missing");
      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 },
      );
    }

    const decoded = verify(token, JWT_SECRET, {
      algorithms: ["HS256"],
    }) as { id?: string; userId?: string; sessionId?: string };

    const userId = decoded.userId || decoded.id;
    const sessionId = decoded.sessionId;

    if (!userId) {
      throw new Error("Token payload does not contain userId");
    }

    if (!sessionId) {
      console.warn("[Middleware] JWT does not contain sessionId");
      return NextResponse.json(
        { success: false, error: "Session expired" },
        { status: 401 },
      );
    }

    const session = await prisma.userSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        userId: true,
        revokedAt: true,
        revokedReason: true,
        expiresAt: true,
      },
    });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Session expired",
          code: "SESSION_NOT_FOUND",
        },
        { status: 401 },
      );
    }

    if (session.userId !== userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (session.revokedAt) {
      return NextResponse.json(
        {
          success: false,
          error: "Session revoked",
          code: "SESSION_REVOKED",
          reason: session.revokedReason,
        },
        { status: 401 },
      );
    }

    if (session.expiresAt <= new Date()) {
      return NextResponse.json(
        { success: false, error: "Session expired", code: "SESSION_EXPIRED" },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
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
        { success: false, error: "User not found" },
        { status: 401 },
      );
    }

    if (!user.isVerified) {
      return NextResponse.json(
        {
          success: false,
          error: "Email not verified",
          code: "EMAIL_NOT_VERIFIED",
        },
        { status: 403 },
      );
    }

    const requestHeaders = new Headers(req.headers);
    requestHeaders.delete("x-user-id");
    requestHeaders.delete("x-user-email");
    requestHeaders.delete("x-user-role");
    requestHeaders.delete("x-user-plan");
    requestHeaders.delete("x-internal-secret");

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
    if (
      error instanceof Error &&
      (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError")
    ) {
      console.warn("[Middleware] token invalid/expired:", error.message);
      return NextResponse.json(
        { success: false, error: "Unauthorized", code: "TOKEN_INVALID" },
        { status: 401 },
      );
    }

    console.error("❌ PROXY AUTH ERROR:", error);
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }
}

const intlMiddleware = createIntlMiddleware(routing);

const NON_I18N_ROUTES = [
  "/full-test",
  "/practice",
  "/rw-module-test",
  "/math-module-test",
];

function getLocaleRoot(pathname: string): string | null {
  const locales = routing.locales as readonly string[];
  const defaultLocale = routing.defaultLocale;

  if (pathname === "/" || pathname === "") {
    return defaultLocale;
  }

  for (const locale of locales) {
    if (pathname === `/${locale}` || pathname === `/${locale}/`) {
      return locale;
    }
  }

  return null;
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (shouldSkipMiddleware(pathname)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api")) {
    return handleApiAuth(req);
  }

  if (
    NON_I18N_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(route + "/"),
    )
  ) {
    return NextResponse.next();
  }

  const localeRoot = getLocaleRoot(pathname);
  if (localeRoot) {
    const url = req.nextUrl.clone();
    url.pathname = `/${localeRoot}/pages/home`;
    return NextResponse.redirect(url);
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ["/api/:path*", "/((?!_next/static|_next/image|_vercel|.*\\..*).*)"],
};
