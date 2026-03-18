import { NextRequest } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/permissions";
import { ok, forbidden, unauthorized, serverError } from "@/lib/api-response";

/** GET /api/admin/audit-logs */
export async function GET(req: NextRequest) {
  const session = await getAuth();
  if (!session) return unauthorized();

  const user = { id: session.user.id, role: session.user.role };
  if (!isSuperAdmin(user)) return forbidden();

  const { searchParams } = req.nextUrl;
  const page  = parseInt(searchParams.get("page")  ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "50");
  const skip  = (page - 1) * limit;

  try {
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          performer: { select: { id: true, fullName: true, role: true } },
          user:      { select: { id: true, fullName: true } },
        },
      }),
      prisma.auditLog.count(),
    ]);

    return ok({ logs, total, page, limit });
  } catch (err) {
    console.error("[GET /api/admin/audit-logs]", err);
    return serverError();
  }
}
