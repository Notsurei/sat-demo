import { NextRequest } from "next/server";
import { UnauthorizedError } from "./permission";

export interface AuthUser {
  id: string;
  role: string;
  plan?: string;
}

export function getUserFromRequest(req: NextRequest): AuthUser {
  console.log("========== AUTH DEBUG ==========");

  const id = req.headers.get("x-user-id");
  const role = req.headers.get("x-user-role");
  const plan = req.headers.get("x-user-plan");

  console.log("X-USER-ID:", id);
  console.log("X-USER-ROLE:", role);
  console.log("X-USER-PLAN:", plan);

  if (!id || !role) {
    console.log("❌ USER HEADERS NOT FOUND");
    console.log("================================");

    throw new UnauthorizedError("Authentication required");
  }

  console.log("✅ USER FROM PROXY:", {
    id,
    role,
    plan,
  });

  console.log("================================");

  return {
    id,
    role,
    plan: plan ?? undefined,
  };
}