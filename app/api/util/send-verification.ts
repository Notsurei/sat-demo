import { createHash, randomBytes } from "crypto";

import { prisma } from "@/app/api/util/prisma";
import { transporter } from "@/app/api/util/mailer";

interface SendVerificationParams {
  userId: string;
  email: string;
  firstName: string | null;
  appUrl: string;
}

export async function sendVerificationEmail(
  params: SendVerificationParams,
): Promise<{ rawToken: string; verifyUrl: string }> {
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");

  await prisma.user.update({
    where: { id: params.userId },
    data: {
      verifyToken: tokenHash,
      verifyTokenExpiry: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  const base = params.appUrl.replace(/\/+$/, "");
  const verifyUrl = new URL("/api/auth/verify-email", base);
  verifyUrl.searchParams.set("token", rawToken);

  const displayName = params.firstName?.trim() || "there";

  await transporter.sendMail({
    from: process.env.MAIL_FROM ?? "SAT Learning <noreply@yourdomain.com>",
    to: params.email,
    subject: "Verify your SAT Learning account",

    text: `Hi ${displayName},

Thank you for registering for SAT Learning.

Please verify your email address by opening this link:
${verifyUrl.toString()}

This link expires in 1 hour.

If you did not create this account, please ignore this email.

— The SAT Learning team
${base}`,

    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </head>
        <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6;padding:24px 0;">
            <tr>
              <td align="center">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;max-width:600px;">
                  <tr>
                    <td style="padding:32px 32px 16px 32px;">
                      <h1 style="margin:0 0 16px 0;color:#111827;font-size:22px;">
                        Hi ${displayName}, welcome to SAT Learning!
                      </h1>
                      <p style="margin:0 0 12px 0;color:#4b5563;font-size:15px;line-height:1.6;">
                        Thank you for creating an account. Please verify your
                        email address to activate your account.
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td align="center" style="padding:8px 32px 24px 32px;">
                      <a
                        href="${verifyUrl.toString()}"
                        style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:bold;font-size:15px;"
                      >
                        Verify Email Address
                      </a>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:0 32px 24px 32px;">
                      <p style="margin:0 0 8px 0;color:#6b7280;font-size:13px;">
                        Or copy this link into your browser:
                      </p>
                      <p style="margin:0;word-break:break-all;font-size:12px;">
                        <a href="${verifyUrl.toString()}" style="color:#2563eb;">
                          ${verifyUrl.toString()}
                        </a>
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:0 32px 24px 32px;border-top:1px solid #e5e7eb;">
                      <p style="margin:16px 0 8px 0;color:#6b7280;font-size:13px;">
                        This link will expire in <strong>1 hour</strong>.
                      </p>
                      <p style="margin:0;color:#9ca3af;font-size:12px;">
                        If you didn't create this account, you can safely
                        ignore this email.
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:16px 32px 24px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;border-radius:0 0 12px 12px;">
                      <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
                        SAT Learning ·
                        <a href="${base}" style="color:#2563eb;text-decoration:none;">
                          ${new URL(base).hostname}
                        </a>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  });

  return { rawToken, verifyUrl: verifyUrl.toString() };
}
