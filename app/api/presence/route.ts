import { NextRequest } from "next/server";
import { getAuth } from "@/lib/auth";
import { error, ok, serverError, unauthorized } from "@/lib/api-response";
import prisma from "@/lib/prisma";
import { PRESENCE_TIMEOUT_MS } from "@/lib/presence";

export const dynamic = "force-dynamic";

/**
 * POST /api/presence
 * Records whether the authenticated user currently has the platform open.
 */
export async function POST(req: NextRequest) {
  const session = await getAuth();
  if (!session) return unauthorized();

  try {
    const body = await req.json().catch(() => null);
    if (typeof body?.online !== "boolean") {
      return error("online must be a boolean");
    }

    const now = new Date();
    const staleBefore = new Date(now.getTime() - PRESENCE_TIMEOUT_MS);

    await prisma.$transaction([
      // Opportunistically repair presence left behind by closed/crashed tabs.
      prisma.user.updateMany({
        where: {
          isOnline: true,
          OR: [
            { lastSeenAt: null },
            { lastSeenAt: { lt: staleBefore } },
          ],
        },
        data: { isOnline: false },
      }),
      prisma.user.update({
        where: { id: session.user.id },
        data: {
          isOnline: body.online,
          lastSeenAt: now,
        },
      }),
    ]);

    return ok({ online: body.online, lastSeenAt: now });
  } catch (err) {
    console.error("[POST /api/presence]", err);
    return serverError();
  }
}
