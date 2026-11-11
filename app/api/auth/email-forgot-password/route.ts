"use server";
import { NextResponse } from "next/server";
import { prisma } from "../../util/prisma";
import { transporter } from "../../util/mailer";
import { randomInt } from "crypto";

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
      return NextResponse.json({
        success: true,
        message: "If an account exists, instructions were sent.",
      });
    }

    const generatedToken = randomInt(100000, 1000000).toString();
    const tokenExpiry = new Date(Date.now() + 3600000);

    // const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const appUrl = "http://localhost:3000";
    const resetLink = `${appUrl}/pages/email-reset-password`;

    await prisma.user.update({
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
      success: true,
      message: "Email sent",
    });
  } catch (error) {
    console.error("[ForgotPassword] Error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
