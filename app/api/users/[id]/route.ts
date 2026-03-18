import { NextRequest } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isSuperAdmin, canManageUser } from "@/lib/permissions";
import {
  ok, forbidden, unauthorized, notFound, serverError, requireFields,
} from "@/lib/api-response";
import { auditLog } from "@/lib/audit";

/** GET /api/users/[id] */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getAuth();
  if (!session) return unauthorized();

  const actor = { id: session.user.id, role: session.user.role };
  const canAccess = await canManageUser(actor, params.id);
  if (!canAccess) return forbidden();

  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true, fullName: true, email: true, role: true,
        status: true, country: true, timezone: true,
        avatarUrl: true, specialty: true, bio: true,
        isOnline: true, lastSeenAt: true, emailVerified: true,
        createdAt: true, updatedAt: true,
        supervisorRelations: isSuperAdmin(actor)
          ? { select: { artist: { select: { id: true, fullName: true, avatarUrl: true } } } }
          : false,
        artistRelations: isSuperAdmin(actor)
          ? { select: { supervisor: { select: { id: true, fullName: true, avatarUrl: true } } } }
          : false,
      },
    });
    if (!user) return notFound("User");
    return ok(user);
  } catch (err) {
    return serverError();
  }
}

/** PATCH /api/users/[id] — Update user */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getAuth();
  if (!session) return unauthorized();

  const actor = { id: session.user.id, role: session.user.role };
  const canAccess = await canManageUser(actor, params.id);
  if (!canAccess) return forbidden();

  try {
    const body = await req.json();

    // Only super admin can change roles or status
    if ((body.role || body.status) && !isSuperAdmin(actor)) {
      return forbidden();
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: {
        fullName:  body.fullName,
        country:   body.country,
        timezone:  body.timezone,
        specialty: body.specialty,
        bio:       body.bio,
        avatarUrl: body.avatarUrl,
        ...(isSuperAdmin(actor) && {
          role:   body.role,
          status: body.status,
        }),
      },
      select: {
        id: true, fullName: true, email: true, role: true,
        status: true, country: true, timezone: true,
        avatarUrl: true, specialty: true, bio: true,
      },
    });

    await auditLog({
      userId:      params.id,
      performedBy: actor.id,
      action:      "USER_UPDATED",
      resource:    `user:${params.id}`,
      metadata:    { fields: Object.keys(body) },
    });

    return ok(updated);
  } catch (err) {
    return serverError();
  }
}

/** DELETE /api/users/[id] — Super admin only */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getAuth();
  if (!session) return unauthorized();

  if (!isSuperAdmin({ id: session.user.id, role: session.user.role })) {
    return forbidden();
  }

  try {
    await prisma.user.update({
      where: { id: params.id },
      data:  { status: "INACTIVE" },
    });

    await auditLog({
      userId:      params.id,
      performedBy: session.user.id,
      action:      "USER_DEACTIVATED",
      resource:    `user:${params.id}`,
    });

    return ok({ deactivated: true });
  } catch (err) {
    return serverError();
  }
}
