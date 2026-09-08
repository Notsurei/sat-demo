"use server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../util/prisma";
import { requireAdmin } from "../../util/permission";

export async function GET(request: NextRequest) {
  try {
    const users = await prisma.user.findMany();
    const role = request.headers.get("x-user-role");
    requireAdmin(role);

    if (!users || users.length === 0) {
      return NextResponse.json({ message: "No user found" }, { status: 404 });
    }

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
