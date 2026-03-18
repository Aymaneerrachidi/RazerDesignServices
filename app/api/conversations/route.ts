import { NextRequest } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isSuperAdmin, isSupervisor, artistCanContactSupervisor, supervisorCanAccessArtist } from "@/lib/permissions";
import { ok, created, forbidden, unauthorized, error, serverError } from "@/lib/api-response";

/** GET /api/conversations — List my conversations */
export async function GET(_req: NextRequest) {
  const session = await getAuth();
  if (!session) return unauthorized();

  const userId = session.user.id;

  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: { some: { userId } },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true, fullName: true, avatarUrl: true,
                role: true, isOnline: true, lastSeenAt: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            sender: { select: { id: true, fullName: true } },
          },
        },
      },
      orderBy: { lastMessageAt: "desc" },
    });

    // Compute unread counts per conversation
    const withUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unread = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId:       { not: userId },
            readReceipts:   { none: { userId } },
          },
        });
        return {
          ...conv,
          unreadCount: unread,
          otherUser: conv.participants
            .find((p) => p.userId !== userId)
            ?.user ?? null,
        };
      })
    );

    return ok(withUnread);
  } catch (err) {
    console.error("[GET /api/conversations]", err);
    return serverError();
  }
}

/** POST /api/conversations — Create or get a 1:1 conversation */
export async function POST(req: NextRequest) {
  const session = await getAuth();
  if (!session) return unauthorized();

  const actor = { id: session.user.id, role: session.user.role };

  try {
    const { targetUserId } = await req.json();
    if (!targetUserId) return error("targetUserId is required");
    if (targetUserId === actor.id) return error("Cannot create a conversation with yourself");

    // Permission checks
    const target = await prisma.user.findUnique({
      where:  { id: targetUserId },
      select: { id: true, role: true },
    });
    if (!target) return error("Target user not found");

    if (actor.role === "ARTIST") {
      // Artist can only talk to supervisors they are assigned to
      if (target.role !== "SUPERVISOR" && target.role !== "SUPER_ADMIN") {
        return forbidden();
      }
      const can = await artistCanContactSupervisor(actor.id, targetUserId);
      if (!can && !isSuperAdmin({ id: targetUserId, role: target.role })) {
        return forbidden();
      }
    }

    if (actor.role === "SUPERVISOR") {
      // Supervisor can only talk to their artists
      if (target.role === "ARTIST") {
        const can = await supervisorCanAccessArtist(actor.id, targetUserId);
        if (!can && !isSuperAdmin(actor)) return forbidden();
      }
    }

    // Find existing conversation between these two
    const existing = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: actor.id } } },
          { participants: { some: { userId: targetUserId } } },
        ],
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, fullName: true, avatarUrl: true, role: true, isOnline: true } },
          },
        },
      },
    });

    if (existing) return ok(existing);

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        participants: {
          create: [
            { userId: actor.id },
            { userId: targetUserId },
          ],
        },
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, fullName: true, avatarUrl: true, role: true, isOnline: true } },
          },
        },
      },
    });

    return created(conversation);
  } catch (err) {
    console.error("[POST /api/conversations]", err);
    return serverError();
  }
}
