export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export function requireAdminOrVip(
  role: string | null,
  plan: string | null,
) {
  const isAdmin = role === "ADMIN";
  const isVip = plan === "VIP";

  if (!isAdmin && !isVip) {
    throw new ForbiddenError("Forbidden");
  }
}

export function requireAdmin(role: string | null) {
  const isAdmin = role === "ADMIN";

  if (!isAdmin) {
    throw new ForbiddenError("Only Admin can do this");
  }
}