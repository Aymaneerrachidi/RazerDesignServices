import { NextRequest } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { canReadAssignment, canWriteAssignment, isSuperAdmin } from "@/lib/permissions";
import {
  ok, forbidden, unauthorized, notFound, serverError,
} from "@/lib/api-response";
import { auditLog } from "@/lib/audit";

/** GET /api/assignments/[id] */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getAuth();
  if (!session) return unauthorized();

  const user = { id: session.user.id, role: session.user.role };
  const allowed = await canReadAssignment(user, params.id);
  if (!allowed) return forbidden();

  try {
    const assignment = await prisma.assignment.findUnique({
      where: { id: params.id },
      include: {
        artist:     { select: { id: true, fullName: true, avatarUrl: true, specialty: true, email: true } },
        createdBy:  { select: { id: true, fullName: true, avatarUrl: true } },
        region:     { select: { id: true, name: true, code: true, timezone: true } },
        attachments: true,
        submissions: {
          include: {
            files: true,
            comments: {
              orderBy: { createdAt: "asc" },
            },
            reviewedBy: { select: { id: true, fullName: true, avatarUrl: true } },
          },
          orderBy: { submittedAt: "desc" },
        },
      },
    });
    if (!assignment) return notFound("Assignment");
    return ok(assignment);
  } catch {
    return serverError();
  }
}

/** PATCH /api/assignments/[id] */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getAuth();
  if (!session) return unauthorized();

  const user    = { id: session.user.id, role: session.user.role };
  const allowed = await canWriteAssignment(user, params.id);
  if (!allowed) return forbidden();

  try {
    const body = await req.json();
    const {
      title, description, referenceNotes, tags,
      priority, status, deadlineUtc, regionId,
    } = body;

    const updated = await prisma.assignment.update({
      where: { id: params.id },
      data: {
        title:          title,
        description:    description,
        referenceNotes: referenceNotes,
        tags:           tags,
        priority:       priority,
        status:         status,
        deadlineUtc:    deadlineUtc ? new Date(deadlineUtc) : undefined,
        regionId:       regionId,
      },
      include: {
        artist:     { select: { id: true, fullName: true, avatarUrl: true } },
        attachments: true,
      },
    });

    await auditLog({
      performedBy: user.id,
      action:      "ASSIGNMENT_UPDATED",
      resource:    `assignment:${params.id}`,
      metadata:    { fields: Object.keys(body) },
    });

    return ok(updated);
  } catch {
    return serverError();
  }
}

/** DELETE /api/assignments/[id] — super admin / creator only */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getAuth();
  if (!session) return unauthorized();

  const user    = { id: session.user.id, role: session.user.role };
  const allowed = await canWriteAssignment(user, params.id);
  if (!allowed) return forbidden();

  try {
    await prisma.assignment.delete({ where: { id: params.id } });
    await auditLog({
      performedBy: user.id,
      action:      "ASSIGNMENT_DELETED",
      resource:    `assignment:${params.id}`,
    });
    return ok({ deleted: true });
  } catch {
    return serverError();
  }
}
