"use server";
import { NextResponse } from "next/server";
import { prisma } from "../../../util/prisma";
import { requireAdminOrVip } from "../../../util/permission";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: examId } = await params;

    const role = request.headers.get("x-user-role");
    const plan = request.headers.get("x-user-plan");

    requireAdminOrVip(role, plan);

    await prisma.exam.delete({
      where: {
        id: examId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Deleted exam successfully",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Delete failed",
      },
      {
        status: 500,
      },
    );
  }
}
