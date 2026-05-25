import { NextRequest } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { canAccessConversation, isSupervisor } from "@/lib/permissions";
import { ok, forbidden, unauthorized, notFound, error, serverError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

const EDIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/** PATCH /api/conversations/[id]/messages/[msgId] — edit own message */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; msgId: string } }
) {
  const session = await getAuth();
  if (!session) return unauthorized();

  const user    = { id: session.user.id, role: session.user.role };
  const allowed = await canAccessConversation(user, params.id);
  if (!allowed) return forbidden();

  try {
    const message = await prisma.message.findUnique({
      where: { id: params.msgId },
    });
    if (!message || message.deletedAt) return notFound("Message");
    if (message.senderId !== session.user.id) return forbidden();

    // 15-minute edit window
    const ageMs = Date.now() - new Date(message.createdAt).getTime();
    if (ageMs > EDIT_WINDOW_MS) {
      return error("Edit window has expired (15 minutes)", 403);
    }

    const { content } = await req.json();
    if (!content?.trim()) return error("Content is required");

    const updated = await prisma.message.update({
      where: { id: params.msgId },
      data:  { content: content.trim(), editedAt: new Date() },
      include: {
        sender:       { select: { id: true, fullName: true, avatarUrl: true, role: true } },
        attachments:  true,
        readReceipts: true,
      },
    });

    return ok(updated);
  } catch (err) {
    console.error("[PATCH /api/conversations/[id]/messages/[msgId]]", err);
    return serverError();
  }
}

/** DELETE /api/conversations/[id]/messages/[msgId] — soft-delete a message */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; msgId: string } }
) {
  const session = await getAuth();
  if (!session) return unauthorized();

  const user    = { id: session.user.id, role: session.user.role };
  const allowed = await canAccessConversation(user, params.id);
  if (!allowed) return forbidden();

  try {
    const message = await prisma.message.findUnique({
      where: { id: params.msgId },
    });
    if (!message || message.deletedAt) return notFound("Message");

    // Sender can always delete their own; supervisors can delete any message
    const canDelete =
      message.senderId === session.user.id || isSupervisor(user);
    if (!canDelete) return forbidden();

    await prisma.message.update({
      where: { id: params.msgId },
      data:  { deletedAt: new Date() },
    });

    return ok({ deleted: true });
  } catch (err) {
    console.error("[DELETE /api/conversations/[id]/messages/[msgId]]", err);
    return serverError();
  }
}
