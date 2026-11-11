import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { UnauthorizedError } from "./permission";

export interface AuthUser {
  id: string;
  role: string;
  email?: string;
  plan?: string;
}

export function getUserFromRequest(req: NextRequest): AuthUser {
  const cookieToken = req.cookies.get("token")?.value;

  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.substring(7).trim()
    : undefined;

  const token = bearerToken || cookieToken;

  if (!token) {
    throw new UnauthorizedError("Authentication required");
  }

  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    console.error("[Auth] JWT_SECRET missing");
    throw new UnauthorizedError("Server error");
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ["HS256"],
    }) as {
      userId?: string;
      id?: string;
      email?: string;
      role?: string;
      plan?: string;
    };

    const userId = decoded.userId || decoded.id;
    if (!userId || !decoded.role) {
      throw new UnauthorizedError("Invalid token payload");
    }

    return {
      id: userId,
      role: decoded.role,
      email: decoded.email,
      plan: decoded.plan,
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) throw error;
    throw new UnauthorizedError("Invalid or expired token");
  }
}

export async function getAuthenticatedUserId(
  req: Request,
): Promise<string | null> {
  try {
    const user = getUserFromRequest(req as NextRequest);
    return user.id;
  } catch {
    return null;
  }
}
