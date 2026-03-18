import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { hash } from "bcryptjs";
import { ok, error, serverError } from "@/lib/api-response";
import { auditLog } from "@/lib/audit";

/** POST /api/auth/reset-password */
export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();
    if (!token || !password) return error("token and password are required");
    if (password.length < 8)  return error("Password must be at least 8 characters");

    const reset = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: { select: { id: true, email: true, status: true } } },
    });

    if (!reset)                          return error("Invalid or expired reset link");
    if (reset.usedAt)                    return error("This reset link has already been used");
    if (reset.expiresAt < new Date())    return error("This reset link has expired");
    if (reset.user.status !== "ACTIVE")  return error("Account is not active");

    const passwordHash = await hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: reset.userId },
        data:  { passwordHash },
      }),
      prisma.passwordReset.update({
        where: { id: reset.id },
        data:  { usedAt: new Date() },
      }),
    ]);

    await auditLog({
      userId:      reset.userId,
      performedBy: reset.userId,
      action:      "PASSWORD_CHANGED",
    });

    return ok({ message: "Password has been reset successfully." });
  } catch (err) {
    console.error("[POST /api/auth/reset-password]", err);
    return serverError();
  }
}
