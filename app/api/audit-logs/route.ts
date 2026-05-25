import { NextRequest } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, unauthorized, serverError } from "@/lib/api-response";
import { getAccessibleArtistIds, isSuperAdmin } from "@/lib/permissions";

export const dynamic = "force-dynamic";

/** GET /api/audit-logs — supervisor sees own + their artists' logs */
export async function GET(req: NextRequest) {
  const session = await getAuth();
  if (!session) return unauthorized();

  const user   = { id: session.user.id, role: session.user.role };
  const filter = req.nextUrl.searchParams.get("filter") ?? "all"; // all | mine | artists
  const page   = parseInt(req.nextUrl.searchParams.get("page") ?? "1", 10);
  const limit  = 50;

  try {
    let performerIds: string[] = [];

    if (isSuperAdmin(user)) {
      // Super admin sees everything — no filter on performer
    } else {
      const artistIds = await getAccessibleArtistIds(user);
      if (filter === "mine") {
        performerIds = [user.id];
      } else if (filter === "artists") {
        performerIds = artistIds;
      } else {
        performerIds = [user.id, ...artistIds];
      }
    }

    const where = isSuperAdmin(user) && filter === "all"
      ? {}
      : { performedBy: { in: performerIds } };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip:    (page - 1) * limit,
        take:    limit,
        include: {
          performer: { select: { id: true, fullName: true, avatarUrl: true, role: true } },
          user:      { select: { id: true, fullName: true, role: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return ok({ logs, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("[GET /api/audit-logs]", err);
    return serverError();
  }
}
