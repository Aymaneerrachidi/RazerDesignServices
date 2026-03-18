import { NextRequest } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, unauthorized, forbidden, serverError } from "@/lib/api-response";

/** PATCH /api/notifications/[id] — Mark single notification read */
export async function PATCH(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getAuth();
  if (!session) return unauthorized();

  try {
    const notif = await prisma.notification.findUnique({ where: { id: params.id } });
    if (!notif || notif.userId !== session.user.id) return forbidden();

    const updated = await prisma.notification.update({
      where: { id: params.id },
      data:  { isRead: true, readAt: new Date() },
    });
    return ok(updated);
  } catch {
    return serverError();
  }
}
