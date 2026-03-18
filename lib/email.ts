import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST    ?? "smtp.gmail.com",
  port:   parseInt(process.env.SMTP_PORT ?? "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = process.env.SMTP_FROM ?? `"Razer Design Services" <${process.env.SMTP_USER}>`;
const BASE = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

export async function sendInviteEmail(
  to: string,
  inviterName: string,
  role: string,
  token: string
): Promise<void> {
  const link = `${BASE}/register?token=${token}`;
  await transporter.sendMail({
    from:    FROM,
    to,
    subject: `You've been invited to Razer Design Services`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#060608;color:#f0f0f5;padding:40px;border-radius:12px">
        <h1 style="color:#00E87A;font-size:24px;margin-bottom:8px">RDS Platform</h1>
        <p style="color:#9090a8">You've been invited by <strong style="color:#f0f0f5">${inviterName}</strong> to join as a <strong style="color:#00E87A">${role.toLowerCase()}</strong>.</p>
        <a href="${link}" style="display:inline-block;margin-top:24px;padding:14px 32px;background:#00E87A;color:#000;text-decoration:none;border-radius:8px;font-weight:700;letter-spacing:1px">Accept Invitation</a>
        <p style="margin-top:24px;color:#555568;font-size:12px">This link expires in 48 hours. If you didn't expect this, you can ignore it.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  token: string
): Promise<void> {
  const link = `${BASE}/reset-password?token=${token}`;
  await transporter.sendMail({
    from:    FROM,
    to,
    subject: `Reset your RDS password`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#060608;color:#f0f0f5;padding:40px;border-radius:12px">
        <h1 style="color:#00E87A;font-size:24px;margin-bottom:8px">Password Reset</h1>
        <p style="color:#9090a8">Click the button below to reset your password. This link expires in 1 hour.</p>
        <a href="${link}" style="display:inline-block;margin-top:24px;padding:14px 32px;background:#00E87A;color:#000;text-decoration:none;border-radius:8px;font-weight:700;letter-spacing:1px">Reset Password</a>
        <p style="margin-top:24px;color:#555568;font-size:12px">If you didn't request this, ignore this email.</p>
      </div>
    `,
  });
}

export async function sendNotificationEmail(
  to: string,
  subject: string,
  body: string
): Promise<void> {
  await transporter.sendMail({
    from:    FROM,
    to,
    subject,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#060608;color:#f0f0f5;padding:40px;border-radius:12px">
        <h1 style="color:#00E87A;font-size:20px;margin-bottom:16px">Razer Design Services</h1>
        <p style="color:#9090a8;line-height:1.6">${body}</p>
        <a href="${BASE}" style="display:inline-block;margin-top:24px;padding:12px 28px;background:#00E87A;color:#000;text-decoration:none;border-radius:8px;font-weight:700;font-size:13px">Open Platform</a>
      </div>
    `,
  });
}
