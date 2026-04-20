import { NextRequest } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isSuperAdmin, isSupervisor, getAccessibleArtistIds } from "@/lib/permissions";
import {
  ok, created, forbidden, unauthorized, error, serverError,
} from "@/lib/api-response";
import { auditLog } from "@/lib/audit";
import { notifyNewAssignment } from "@/lib/notifications";

/** GET /api/assignments */
export async function GET(req: NextRequest) {
  const session = await getAuth();
  if (!session) return unauthorized();

  const user   = { id: session.user.id, role: session.user.role };
  const params = req.nextUrl.searchParams;
  const status = params.get("status");
  const search = params.get("search") ?? "";

  try {
    if (isSuperAdmin(user)) {
      const assignments = await prisma.assignment.findMany({
        where: {
          status: (status as any) ?? undefined,
          OR: search
            ? [{ title: { contains: search, mode: "insensitive" } }]
            : undefined,
        },
        include: {
          artist:     { select: { id: true, fullName: true, avatarUrl: true, specialty: true } },
          createdBy:  { select: { id: true, fullName: true } },
          region:     { select: { id: true, name: true, code: true } },
          attachments: true,
          _count:     { select: { submissions: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return ok(assignments);
    }

    if (isSupervisor(user)) {
      const artistIds = await getAccessibleArtistIds(user);
      const assignments = await prisma.assignment.findMany({
        where: {
          AND: [
            { OR: [{ createdById: user.id }, { supervisorId: user.id }, { artistId: { in: artistIds } }] },
            { status: (status as any) ?? undefined },
            search
              ? { OR: [{ title: { contains: search, mode: "insensitive" } }] }
              : {},
          ],
        },
        include: {
          artist:     { select: { id: true, fullName: true, avatarUrl: true, specialty: true } },
          createdBy:  { select: { id: true, fullName: true } },
          region:     { select: { id: true, name: true, code: true } },
          attachments: true,
          _count:     { select: { submissions: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return ok(assignments);
    }

    // Artist — only their own assignments
    const assignments = await prisma.assignment.findMany({
      where: {
        artistId: user.id,
        status:   (status as any) ?? undefined,
      },
      include: {
        createdBy:  { select: { id: true, fullName: true, avatarUrl: true } },
        region:     { select: { id: true, name: true, code: true } },
        attachments: true,
        _count:     { select: { submissions: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return ok(assignments);
  } catch (err) {
    console.error("[GET /api/assignments]", err);
    return serverError();
  }
}

/** POST /api/assignments — Create assignment (supervisor/admin only) */
export async function POST(req: NextRequest) {
  const session = await getAuth();
  if (!session) return unauthorized();

  const user = { id: session.user.id, role: session.user.role };
  if (!isSupervisor(user)) return forbidden();

  try {
    const body = await req.json();
    const { title, description, artistId, deadlineUtc, priority, referenceNotes, tags, regionId, attachments } = body;

    if (!title || !description || !artistId || !deadlineUtc) {
      return error("title, description, artistId, and deadlineUtc are required");
    }

    // Verify supervisor has access to this artist
    const accessible = await getAccessibleArtistIds(user);
    if (!accessible.includes(artistId)) return forbidden();

    const assignment = await prisma.assignment.create({
      data: {
        title,
        description,
        referenceNotes,
        tags:         tags ?? [],
        artistId,
        createdById:  user.id,
        supervisorId: user.id,
        regionId,
        priority:     priority ?? "MEDIUM",
        deadlineUtc:  new Date(deadlineUtc),
        status:       "PENDING",
        attachments: attachments?.length
          ? {
              create: attachments.map((f: any) => ({
                fileName: f.fileName,
                fileUrl:  f.fileUrl,
                fileSize: f.fileSize,
                mimeType: f.mimeType,
                publicId: f.publicId,
              })),
            }
          : undefined,
      },
      include: {
        artist:    { select: { id: true, fullName: true, avatarUrl: true } },
        createdBy: { select: { id: true, fullName: true } },
        attachments: true,
      },
    });

    // Notify the artist
    await notifyNewAssignment(artistId, title, assignment.id);

    // Emit socket event
    const io = (globalThis as any).__socketio;
    if (io) {
      io.to(`user:${artistId}`).emit("notification:new", {
        type:  "NEW_ASSIGNMENT",
        title: "New Assignment",
        body:  title,
      });
    }

    await auditLog({
      performedBy: user.id,
      action:      "ASSIGNMENT_CREATED",
      resource:    `assignment:${assignment.id}`,
      metadata:    { title, artistId },
    });

    return created(assignment);
  } catch (err) {
    console.error("[POST /api/assignments]", err);
    return serverError();
  }
}
