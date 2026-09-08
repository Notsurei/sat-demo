"use server";
import { NextResponse } from "next/server";
import { prisma } from "../../../util/prisma";
import { requireAdmin } from "@/app/api/util/permission";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const role = request.headers.get("x-user-role");

    requireAdmin(role);

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message,
      },
      {
        status: error.message === "Only Admin can do this" ? 403 : 500,
      },
    );
  }
}
