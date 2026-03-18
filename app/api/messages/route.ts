import { NextRequest, NextResponse } from "next/server";
import { addMessage, getMessages, setTyping, clearTyping } from "@/lib/message-store";
import type { Message } from "@/lib/types";

/** GET /api/messages?conversationId=artist-1 */
export async function GET(req: NextRequest) {
  const conversationId = req.nextUrl.searchParams.get("conversationId");
  if (!conversationId) {
    return NextResponse.json({ error: "conversationId required" }, { status: 400 });
  }
  return NextResponse.json({ messages: getMessages(conversationId) });
}

/** POST /api/messages  body: { conversationId, message: Message } */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { conversationId, message } = body as {
      conversationId: string;
      message: Message;
    };
    if (!conversationId || !message) {
      return NextResponse.json({ error: "conversationId and message required" }, { status: 400 });
    }
    addMessage(conversationId, message);
    return NextResponse.json({ ok: true, message });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

/** PATCH /api/messages  body: { conversationId, senderId, senderName, action: "typing"|"stop" } */
export async function PATCH(req: NextRequest) {
  try {
    const { conversationId, senderName, action } = await req.json();
    if (!conversationId) return NextResponse.json({ ok: false });
    if (action === "typing") setTyping(conversationId, senderName);
    else clearTyping(conversationId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
