import { NextRequest } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { canAccessConversation } from "@/lib/permissions";
import { ok, forbidden, unauthorized, serverError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

/** DELETE /api/conversations/[id] — delete a conversation (hard delete) */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getAuth();
  if (!session) return unauthorized();

  const user    = { id: session.user.id, role: session.user.role };
  const allowed = await canAccessConversation(user, params.id);
  if (!allowed) return forbidden();

  try {
    await prisma.conversation.delete({ where: { id: params.id } });
    return ok({ deleted: true });
  } catch (err) {
    console.error("[DELETE /api/conversations/[id]]", err);
    return serverError();
  }
}
