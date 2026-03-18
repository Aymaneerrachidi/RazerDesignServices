import { NextRequest } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isSuperAdmin, isSupervisor, getAccessibleArtistIds } from "@/lib/permissions";
import { ok, forbidden, unauthorized, serverError } from "@/lib/api-response";

/** GET /api/admin/stats */
export async function GET(_req: NextRequest) {
  const session = await getAuth();
  if (!session) return unauthorized();

  const user = { id: session.user.id, role: session.user.role };

  try {
    if (isSuperAdmin(user)) {
      const [
        totalUsers, totalSupervisors, totalArtists,
        totalAssignments, pendingSubmissions,
        activeAssignments, approvedAssignments,
        recentAuditLogs,
      ] = await Promise.all([
        prisma.user.count({ where: { status: "ACTIVE" } }),
        prisma.user.count({ where: { role: "SUPERVISOR", status: "ACTIVE" } }),
        prisma.user.count({ where: { role: "ARTIST",     status: "ACTIVE" } }),
        prisma.assignment.count(),
        prisma.submission.count({ where: { status: "PENDING" } }),
        prisma.assignment.count({ where: { status: { in: ["PENDING", "IN_PROGRESS"] } } }),
        prisma.assignment.count({ where: { status: "APPROVED" } }),
        prisma.auditLog.findMany({
          orderBy: { createdAt: "desc" },
          take:    10,
          include: {
            performer: { select: { id: true, fullName: true, role: true } },
            user:      { select: { id: true, fullName: true } },
          },
        }),
      ]);

      return ok({
        totalUsers, totalSupervisors, totalArtists,
        totalAssignments, pendingSubmissions,
        activeAssignments, approvedAssignments,
        recentAuditLogs,
      });
    }

    if (isSupervisor(user)) {
      const artistIds = await getAccessibleArtistIds(user);
      const [
        totalArtists, activeAssignments, pendingSubmissions,
        approvedAssignments, unreadMessages,
      ] = await Promise.all([
        Promise.resolve(artistIds.length),
        prisma.assignment.count({
          where: {
            supervisorId: user.id,
            status: { in: ["PENDING", "IN_PROGRESS"] },
          },
        }),
        prisma.submission.count({
          where: {
            status: "PENDING",
            assignment: { OR: [{ createdById: user.id }, { supervisorId: user.id }] },
          },
        }),
        prisma.assignment.count({
          where: { supervisorId: user.id, status: "APPROVED" },
        }),
        prisma.message.count({
          where: {
            senderId:    { not: user.id },
            readReceipts: { none: { userId: user.id } },
            conversation: { participants: { some: { userId: user.id } } },
          },
        }),
      ]);

      return ok({
        totalArtists, activeAssignments, pendingSubmissions,
        approvedAssignments, unreadMessages,
      });
    }

    // Artist stats
    const [
      activeAssignments, submittedCount,
      approvedCount, revisionCount,
    ] = await Promise.all([
      prisma.assignment.count({
        where: { artistId: user.id, status: { in: ["PENDING", "IN_PROGRESS"] } },
      }),
      prisma.submission.count({ where: { artistId: user.id, status: "PENDING" } }),
      prisma.submission.count({ where: { artistId: user.id, status: "APPROVED" } }),
      prisma.assignment.count({ where: { artistId: user.id, status: "REVISION" } }),
    ]);

    return ok({ activeAssignments, submittedCount, approvedCount, revisionCount });
  } catch (err) {
    console.error("[GET /api/admin/stats]", err);
    return serverError();
  }
}
