import { NextRequest } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { canReviewSubmission } from "@/lib/permissions";
import { ok, forbidden, unauthorized, notFound, error, serverError } from "@/lib/api-response";
import { auditLog } from "@/lib/audit";
import { notifySubmissionReviewed } from "@/lib/notifications";

/** POST /api/submissions/[id]/review */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getAuth();
  if (!session) return unauthorized();

  const user    = { id: session.user.id, role: session.user.role };
  const allowed = await canReviewSubmission(user, params.id);
  if (!allowed) return forbidden();

  try {
    const { status, feedback } = await req.json() as {
      status:   "APPROVED" | "REVISION" | "REJECTED";
      feedback?: string;
    };

    if (!["APPROVED", "REVISION", "REJECTED"].includes(status)) {
      return error("status must be APPROVED, REVISION, or REJECTED");
    }

    const submission = await prisma.submission.findUnique({
      where:   { id: params.id },
      include: { assignment: { select: { id: true, title: true, artistId: true } } },
    });
    if (!submission) return notFound("Submission");

    const updated = await prisma.submission.update({
      where: { id: params.id },
      data: {
        status,
        feedback,
        reviewedById: user.id,
        reviewedAt:   new Date(),
      },
    });

    // Update assignment status
    const assignmentStatus = status === "APPROVED"
      ? "APPROVED"
      : status === "REVISION"
      ? "REVISION"
      : "SUBMITTED";

    await prisma.assignment.update({
      where: { id: submission.assignmentId },
      data:  { status: assignmentStatus },
    });

    // Notify artist
    await notifySubmissionReviewed(
      submission.artistId,
      status,
      submission.assignment.title,
      params.id
    );

    // Socket notification
    const io = (globalThis as any).__socketio;
    if (io) {
      io.to(`user:${submission.artistId}`).emit("notification:new", {
        type:  `SUBMISSION_${status}`,
        title: `Submission ${status.toLowerCase()}`,
        body:  submission.assignment.title,
      });
    }

    await auditLog({
      userId:      submission.artistId,
      performedBy: user.id,
      action:      "SUBMISSION_REVIEWED",
      resource:    `submission:${params.id}`,
      metadata:    { status, hasFeedback: !!feedback },
    });

    return ok(updated);
  } catch (err) {
    console.error("[POST /api/submissions/[id]/review]", err);
    return serverError();
  }
}
