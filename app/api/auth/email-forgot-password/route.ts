"use server";
import { NextResponse } from "next/server";
import { prisma } from "../../util/prisma";
import { transporter } from "../../util/mailer";

function getRandomInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { message: "If an account exists, instructions were sent." },
        { status: 200 },
      );
    }
    const generatedToken: string = getRandomInt(100000, 999999).toString();
    const tokenExpiry = new Date(Date.now() + 3600000);
    const resetLink = `http://localhost:3000/pages/email-reset-password`;

    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        resetToken: generatedToken,
        resetTokenExpiry: tokenExpiry,
      },
    });

    const mailOption = {
      from: "SAT_Learning support<support@satlearning.com>",
      to: email,
      subject: "Reset Password",
      html: `
      <div style="
        font-family: Arial, sans-serif;
        max-width: 600px;
        margin: 0 auto;
        padding: 24px;
        background: #ffffff;
        border-radius: 12px;
        border: 1px solid #e5e7eb;
      ">
        <h2 style="color:#111827;">
          Reset your password with this token: "${generatedToken}"
        </h2>

        <p style="color:#4b5563;">
          We received a request to reset the password for your account.
        </p>

        <p style="color:#4b5563;">
          Click the button below to create a new password.
        </p>

        <a
          href="${resetLink}"
          style="
            display:inline-block;
            background:#3b82f6;
            color:white;
            text-decoration:none;
            padding:12px 20px;
            border-radius:8px;
            font-weight:bold;
            margin:16px 0;
          "
        >
          Reset Password
        </a>

        <p style="color:#6b7280;font-size:14px;">
          This link will expire in 1 hour.
        </p>

        <hr style="border:none;border-top:1px solid #e5e7eb;" />

        <p style="color:#9ca3af;font-size:12px;">
          If you didn't request a password reset, you can safely ignore this email.
        </p>
      </div>
    `,
    };

    await transporter.sendMail(mailOption);

    return NextResponse.json({
      message: "Email sent",
      data: {
        resetToken: updatedUser.resetToken,
        resetTokenExpiry: updatedUser.resetTokenExpiry,
      },
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process request" },
      { status: 500 },
    );
  }
}
