import { NextRequest } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isSuperAdmin, isSupervisor, canReadAssignment } from "@/lib/permissions";
import {
  ok, created, forbidden, unauthorized, error, serverError,
} from "@/lib/api-response";
import { auditLog } from "@/lib/audit";
import {
  notifySubmissionUploaded,
  notifySubmissionReviewed,
} from "@/lib/notifications";

/** GET /api/submissions */
export async function GET(req: NextRequest) {
  const session = await getAuth();
  if (!session) return unauthorized();

  const user   = { id: session.user.id, role: session.user.role };
  const params = req.nextUrl.searchParams;
  const assignmentId = params.get("assignmentId");
  const status       = params.get("status");

  try {
    if (isSuperAdmin(user)) {
      const submissions = await prisma.submission.findMany({
        where: {
          assignmentId: assignmentId ?? undefined,
          status:       (status as any) ?? undefined,
        },
        include: {
          artist:    { select: { id: true, fullName: true, avatarUrl: true } },
          files:      true,
          reviewedBy: { select: { id: true, fullName: true, avatarUrl: true } },
          assignment: { select: { id: true, title: true, deadlineUtc: true } },
          comments:   { orderBy: { createdAt: "asc" } },
        },
        orderBy: { submittedAt: "desc" },
      });
      return ok(submissions);
    }

    if (isSupervisor(user)) {
      const submissions = await prisma.submission.findMany({
        where: {
          status: (status as any) ?? undefined,
          assignment: {
            OR: [{ createdById: user.id }, { supervisorId: user.id }],
          },
        },
        include: {
          artist:    { select: { id: true, fullName: true, avatarUrl: true, specialty: true } },
          files:      true,
          reviewedBy: { select: { id: true, fullName: true } },
          assignment: { select: { id: true, title: true, deadlineUtc: true, priority: true } },
        },
        orderBy: { submittedAt: "desc" },
      });
      return ok(submissions);
    }

    // Artist — only their own
    const submissions = await prisma.submission.findMany({
      where: {
        artistId:     user.id,
        assignmentId: assignmentId ?? undefined,
      },
      include: {
        files:      true,
        reviewedBy: { select: { id: true, fullName: true } },
        assignment: { select: { id: true, title: true, status: true } },
        comments:   { orderBy: { createdAt: "asc" } },
      },
      orderBy: { submittedAt: "desc" },
    });
    return ok(submissions);
  } catch (err) {
    console.error("[GET /api/submissions]", err);
    return serverError();
  }
}

/** POST /api/submissions — Artist submits artwork */
export async function POST(req: NextRequest) {
  const session = await getAuth();
  if (!session) return unauthorized();

  const user = { id: session.user.id, role: session.user.role };
  if (!user.role || user.role !== "ARTIST") return forbidden();

  try {
    const body = await req.json();
    const { assignmentId, note, files } = body as {
      assignmentId: string;
      note?:        string;
      files:        Array<{ fileName: string; fileUrl: string; fileSize: number; mimeType: string; publicId?: string }>;
    };

    if (!assignmentId || !files?.length) {
      return error("assignmentId and at least one file are required");
    }

    // Verify artist is assigned to this assignment
    const assignment = await prisma.assignment.findFirst({
      where: { id: assignmentId, artistId: user.id },
      include: {
        createdBy: { select: { id: true, fullName: true } },
      },
    });
    if (!assignment) return forbidden();

    // Get next version number
    const lastSubmission = await prisma.submission.findFirst({
      where: { assignmentId, artistId: user.id },
      orderBy: { versionNumber: "desc" },
    });

    const versionNumber = (lastSubmission?.versionNumber ?? 0) + 1;

    const submission = await prisma.submission.create({
      data: {
        assignmentId,
        artistId:      user.id,
        note,
        versionNumber,
        status:        "PENDING",
        files: {
          create: files.map((f) => ({
            fileName: f.fileName,
            fileUrl:  f.fileUrl,
            fileSize: f.fileSize,
            mimeType: f.mimeType,
            publicId: f.publicId,
          })),
        },
      },
      include: { files: true },
    });

    // Update assignment status
    await prisma.assignment.update({
      where: { id: assignmentId },
      data:  { status: "SUBMITTED" },
    });

    // Notify supervisor
    const artistUser = await prisma.user.findUnique({
      where:  { id: user.id },
      select: { fullName: true },
    });
    await notifySubmissionUploaded(
      assignment.supervisorId ?? assignment.createdById,
      artistUser?.fullName ?? "Artist",
      submission.id
    );

    // Socket notification
    const io = (globalThis as any).__socketio;
    if (io) {
      io.to(`user:${assignment.supervisorId ?? assignment.createdById}`)
        .emit("notification:new", {
          type:  "SUBMISSION_UPLOADED",
          title: "New Submission",
          body:  assignment.title,
        });
    }

    await auditLog({
      userId:      user.id,
      performedBy: user.id,
      action:      "SUBMISSION_CREATED",
      resource:    `submission:${submission.id}`,
      metadata:    { assignmentId, versionNumber },
    });

    return created(submission);
  } catch (err) {
    console.error("[POST /api/submissions]", err);
    return serverError();
  }
}
