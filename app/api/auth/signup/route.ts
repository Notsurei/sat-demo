"use server";

import { NextResponse } from "next/server";
import { prisma } from "@/app/api/util/prisma";
import { transporter } from "@/app/api/util/mailer";

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";

const phoneRegex = new RegExp(
  /^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-]?[\s]?[0-9])+$/
);

const SignupSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().regex(phoneRegex, "Invalid phone number"),
  email: z.email(),
  password: z.string().min(6),
  gender: z.enum(["MALE", "FEMALE", "OTHERS"]),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = SignupSchema.parse(body);
    const { firstName, lastName, phone, email, password, gender } = parsed;

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error: "User already exists",
        },
        {
          status: 409,
        },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const verifyToken = jwt.sign(
      {
        email,
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: "1h",
      },
    );

    await prisma.user.create({
      data: {
        firstName,
        lastName,
        phone,
        email,
        passwordHash,
        gender,

        isVerified: false,

        verifyToken,
        verifyTokenExpiry: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const verifyUrl = `${appUrl}/api/auth/verify-email?token=${verifyToken}`;

    await transporter.sendMail({
      from: "SAT Tool <support@kvblog.com>",
      to: email,
      subject: "Verify your SAT Tool account",

      html: `
      <h1>Welcome to SAT Tool</h1>

      <p>Click the button below to verify your account.</p>
      <p>If you don't create any account on our platform, please ignore this message</p>

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
        message: "Account created. Please check your email.",
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      {
        status: 500,
      },
    );
  }
}
