import { NextRequest } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, unauthorized, serverError } from "@/lib/api-response";

/** GET /api/notifications */
export async function GET(_req: NextRequest) {
  const session = await getAuth();
  if (!session) return unauthorized();

  try {
    const notifications = await prisma.notification.findMany({
      where:   { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take:    50,
    });
    return ok(notifications);
  } catch {
    return serverError();
  }
}

/** PATCH /api/notifications — Mark all read */
export async function PATCH(_req: NextRequest) {
  const session = await getAuth();
  if (!session) return unauthorized();

  try {
    await prisma.notification.updateMany({
      where: { userId: session.user.id, isRead: false },
      data:  { isRead: true, readAt: new Date() },
    });
    return ok({ updated: true });
  } catch {
    return serverError();
  }
}
