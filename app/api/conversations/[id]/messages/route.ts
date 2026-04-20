import { NextRequest } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { canAccessConversation } from "@/lib/permissions";
import { created, error, ok, forbidden, unauthorized, serverError } from "@/lib/api-response";

/** GET /api/conversations/[id]/messages */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getAuth();
  if (!session) return unauthorized();

  const user    = { id: session.user.id, role: session.user.role };
  const allowed = await canAccessConversation(user, params.id);
  if (!allowed) return forbidden();

  try {
    const cursor = req.nextUrl.searchParams.get("cursor");
    const limit  = parseInt(req.nextUrl.searchParams.get("limit") ?? "50", 10);

    const messages = await prisma.message.findMany({
      where: {
        conversationId: params.id,
        deletedAt:      null,
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      include: {
        sender: {
          select: {
            id: true, fullName: true, avatarUrl: true, role: true,
          },
        },
        attachments:  true,
        readReceipts: true,
      },
      orderBy: { createdAt: "asc" },
      take:    limit,
    });

    // Mark all as read
    const unread = messages.filter(
      (m) =>
        m.senderId !== session.user.id &&
        !m.readReceipts.some((r) => r.userId === session.user.id)
    );

    if (unread.length > 0) {
      await prisma.messageReadReceipt.createMany({
        data:           unread.map((m) => ({ messageId: m.id, userId: session.user.id })),
        skipDuplicates: true,
      });
    }

    return ok(messages);
  } catch (err) {
    console.error("[GET /api/conversations/[id]/messages]", err);
    return serverError();
  }
}

/** POST /api/conversations/[id]/messages */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getAuth();
  if (!session) return unauthorized();

  const user    = { id: session.user.id, role: session.user.role };
  const allowed = await canAccessConversation(user, params.id);
  if (!allowed) return forbidden();

  try {
    const body = await req.json();
    const content = typeof body.content === "string" ? body.content.trim() : "";
    if (!content) return error("Message content is required");

    const message = await prisma.message.create({
      data: {
        conversationId: params.id,
        senderId:       session.user.id,
        content,
        messageType:    "text",
      },
      include: {
        sender: { select: { id: true, fullName: true, avatarUrl: true, role: true } },
        attachments:  true,
        readReceipts: true,
      },
    });

    await prisma.conversation.update({
      where: { id: params.id },
      data:  { lastMessageAt: new Date(), updatedAt: new Date() },
    });

    const participants = await prisma.conversationParticipant.findMany({
      where: { conversationId: params.id, userId: { not: session.user.id } },
      select: { userId: true },
    });

    if (participants.length > 0) {
      await prisma.notification.createMany({
        data: participants.map((p) => ({
          userId:   p.userId,
          type:     "NEW_MESSAGE",
          title:    `New message from ${session.user.name ?? "User"}`,
          body:     content.slice(0, 80),
          link:     `/messages/${params.id}`,
          metadata: { conversationId: params.id, senderId: session.user.id } as any,
        })),
      });
    }

    return created(message);
  } catch (err) {
    console.error("[POST /api/conversations/[id]/messages]", err);
    return serverError();
  }
}
