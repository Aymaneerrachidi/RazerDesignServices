import { NextRequest } from "next/server";
import { registerSSEClient, unregisterSSEClient, getMessages } from "@/lib/message-store";

/**
 * GET /api/messages/stream?conversationId=artist-1
 *
 * Server-Sent Events endpoint.  The client subscribes once and receives
 * pushed events whenever a message is added to the conversation.
 *
 * Event shapes:
 *   { type: "init",         payload: Message[]              }  — current history on connect
 *   { type: "message",      payload: Message                }  — new message
 *   { type: "typing",       payload: { name: string }       }  — someone is typing
 *   { type: "typing_stop",  payload: {}                     }  — stopped typing
 *   { type: "ping",         payload: {}                     }  — keepalive every 25s
 */
export async function GET(req: NextRequest) {
  const conversationId = req.nextUrl.searchParams.get("conversationId");
  if (!conversationId) {
    return new Response("conversationId required", { status: 400 });
  }

  let controller: ReadableStreamDefaultController;

  const stream = new ReadableStream({
    start(ctrl) {
      controller = ctrl;
      registerSSEClient(conversationId, controller);

      // Send current history immediately on connect
      const history = getMessages(conversationId);
      const init = `data: ${JSON.stringify({ type: "init", payload: history })}\n\n`;
      ctrl.enqueue(new TextEncoder().encode(init));

      // Keepalive ping every 25s to prevent connection timeouts
      const pingInterval = setInterval(() => {
        try {
          ctrl.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: "ping", payload: {} })}\n\n`));
        } catch {
          clearInterval(pingInterval);
        }
      }, 25000);

      // Cleanup on client disconnect
      req.signal.addEventListener("abort", () => {
        clearInterval(pingInterval);
        unregisterSSEClient(conversationId, controller);
        try { ctrl.close(); } catch { /* already closed */ }
      });
    },
    cancel() {
      unregisterSSEClient(conversationId, controller);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering
    },
  });
}
