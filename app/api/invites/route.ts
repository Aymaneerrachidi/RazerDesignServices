import { NextRequest } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isSuperAdmin, isSupervisor } from "@/lib/permissions";
import {
  ok, created, forbidden, unauthorized, error, serverError,
} from "@/lib/api-response";
import { sendInviteEmail } from "@/lib/email";
import { auditLog } from "@/lib/audit";
import { nanoid } from "nanoid";
import { hash } from "bcryptjs";

/** POST /api/invites — Send an invite */
export async function POST(req: NextRequest) {
  const session = await getAuth();
  if (!session) return unauthorized();

  const actor = { id: session.user.id, role: session.user.role };
  if (!isSupervisor(actor)) return forbidden();

  try {
    const body = await req.json();
    const { email, role, country, supervisorId } = body as {
      email: string;
      role: "ARTIST" | "SUPERVISOR";
      country?: string;
      supervisorId?: string;
    };

    if (!email || !role) return error("email and role are required");

    // Supervisors can only invite artists
    if (!isSuperAdmin(actor) && role !== "ARTIST") return forbidden();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return error("A user with this email already exists");

    const pendingInvite = await prisma.invite.findFirst({
      where: { email, status: "PENDING", expiresAt: { gt: new Date() } },
    });
    if (pendingInvite) return error("A pending invite already exists for this email");

    const token     = nanoid(40);
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h

    const invite = await prisma.invite.create({
      data: {
        email,
        role,
        token,
        senderId:    actor.id,
        country,
        supervisorId: role === "ARTIST" ? (supervisorId ?? actor.id) : undefined,
        expiresAt,
      },
    });

    // Send email in background — don't block the response or roll back on email failure
    sendInviteEmail(email, session.user.name ?? "Supervisor", role, token)
      .catch((e) => console.error("[sendInviteEmail]", e));

    await auditLog({
      performedBy: actor.id,
      action:      "INVITE_SENT",
      metadata:    { email, role },
    });

    return created({ id: invite.id, email, role, expiresAt });
  } catch (err) {
    console.error("[POST /api/invites]", err);
    return serverError();
  }
}

/** GET /api/invites — List invites (supervisor/admin) */
export async function GET(req: NextRequest) {
  const session = await getAuth();
  if (!session) return unauthorized();

  const actor = { id: session.user.id, role: session.user.role };
  if (!isSupervisor(actor)) return forbidden();

  try {
    const invites = await prisma.invite.findMany({
      where: isSuperAdmin(actor) ? {} : { senderId: actor.id },
      include: { sender: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: "desc" },
    });
    return ok(invites);
  } catch {
    return serverError();
  }
}
