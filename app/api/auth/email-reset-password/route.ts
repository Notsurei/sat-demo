"use server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../util/prisma";
import bcrypt from "bcrypt";

export async function POST(request: NextRequest) {
  const { token, newPass } = await request.json();

  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: {
        gt: new Date(),
      },
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 400 },
    );
  }

  const hashedPass = await bcrypt.hash(newPass, 10);

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      passwordHash: hashedPass,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });
  return NextResponse.json({
    success: true,
  });
}
