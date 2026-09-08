"use server";

import { NextResponse } from "next/server";
import { prisma } from "@/app/api/util/prisma";
import { transporter } from "@/app/api/util/mailer";
import jwt from "jsonwebtoken";
import { z } from "zod";

const ResendVerificationSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { email } = ResendVerificationSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        {
          status: 404,
        },
      );
    }

    if (user.isVerified) {
      return NextResponse.json(
        {
          success: false,
          error: "User already verified",
        },
        {
          status: 400,
        },
      );
    }

    const verifyToken = jwt.sign(
      {
        email: user.email,
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: "1h",
      },
    );

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        verifyToken,
        verifyTokenExpiry: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const verifyUrl = `${appUrl}/api/auth/verify-email?token=${verifyToken}`;

    await transporter.sendMail({
      from: "SAT Tool <support@kvblog.com>",
      to: user.email,
      subject: "Verify your SAT Tool account",

      html: `
        <h2>Email Verification</h2>

        <p>
          Click the button below to verify your account.
        </p>

        <a
          href="${verifyUrl}"
          style="
            background:#2563eb;
            color:white;
            padding:12px 20px;
            text-decoration:none;
            border-radius:8px;
            display:inline-block;
          "
        >
          Verify Account
        </a>

        <p>
          This link will expire in 1 hour.
        </p>
      `,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Verification email sent",
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      {
        status: 500,
      },
    );
  }
}
