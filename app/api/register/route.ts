import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { hash } from "bcryptjs";
import { ok, created, error, serverError } from "@/lib/api-response";
import { auditLog } from "@/lib/audit";

/** GET /api/register?token=XXX — Look up invite info */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return error("token is required");

  try {
    const invite = await prisma.invite.findUnique({ where: { token } });
    if (!invite)                      return error("Invalid invite token");
    if (invite.status !== "PENDING")  return error("This invite has already been used");
    if (invite.expiresAt < new Date()) return error("This invite has expired");

    return ok({ email: invite.email, role: invite.role });
  } catch {
    return serverError();
  }
}

/** POST /api/register — Accept invite and create account */
export async function POST(req: NextRequest) {
  try {
    const { token, fullName, password, timezone, country } = await req.json();

    if (!token || !fullName || !password) {
      return error("token, fullName, and password are required");
    }
    if (password.length < 8) return error("Password must be at least 8 characters");

    const invite = await prisma.invite.findUnique({ where: { token } });

    if (!invite)                         return error("Invalid or expired invite link");
    if (invite.status !== "PENDING")      return error("This invite has already been used");
    if (invite.expiresAt < new Date())    return error("This invite has expired");

    const passwordHash = await hash(password, 12);

    const user = await prisma.user.create({
      data: {
        fullName:    fullName.trim(),
        email:       invite.email.toLowerCase(),
        passwordHash,
        role:        invite.role,
        status:      "ACTIVE",
        country:     country ?? invite.country,
        timezone:    timezone ?? "UTC",
        emailVerified: true, // Invite flow = email verified
      },
    });

    // Mark invite accepted
    await prisma.invite.update({
      where: { id: invite.id },
      data: {
        status:      "ACCEPTED",
        recipientId: user.id,
        acceptedAt:  new Date(),
      },
    });

    // Auto-create supervisor-artist relationship if specified
    if (user.role === "ARTIST" && invite.supervisorId) {
      await prisma.supervisorArtist.create({
        data: {
          supervisorId: invite.supervisorId,
          artistId:     user.id,
          country:      user.country,
        },
      });

      // Create a conversation between this artist and their supervisor
      const conversation = await prisma.conversation.create({ data: {} });
      await prisma.conversationParticipant.createMany({
        data: [
          { conversationId: conversation.id, userId: invite.supervisorId },
          { conversationId: conversation.id, userId: user.id },
        ],
      });
    }

    await auditLog({
      userId:      user.id,
      performedBy: user.id,
      action:      "USER_CREATED",
      metadata:    { email: user.email, role: user.role, via: "invite" },
    });

    return created({
      id:    user.id,
      email: user.email,
      role:  user.role,
    });
  } catch (err: any) {
    if (err?.code === "P2002") return error("This email is already registered");
    console.error("[POST /api/register]", err);
    return serverError();
  }
}
