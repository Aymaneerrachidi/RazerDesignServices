import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { ok, error, serverError } from "@/lib/api-response";
import { nanoid } from "nanoid";

/** POST /api/auth/forgot-password */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return error("Email is required");

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Always return success to prevent email enumeration
    if (!user || user.status !== "ACTIVE") {
      return ok({ message: "If that email exists, a reset link has been sent." });
    }

    // Invalidate old tokens
    await prisma.passwordReset.updateMany({
      where: { userId: user.id, usedAt: null },
      data:  { usedAt: new Date() },
    });

    const token     = nanoid(40);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordReset.create({
      data: { userId: user.id, token, expiresAt },
    });

    await sendPasswordResetEmail(user.email, token);

    return ok({ message: "If that email exists, a reset link has been sent." });
  } catch (err) {
    console.error("[POST /api/auth/forgot-password]", err);
    return serverError();
  }
}
