/**
 * Socket.io server-side event handlers.
 * Runs in the custom server (server.ts) — NOT in Next.js API routes.
 */

import type { Server, Socket } from "socket.io";
import prisma from "./prisma";
import { canAccessConversation } from "./permissions";

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
  userName?: string;
}

// Track online users:  userId → Set<socketId>
const onlineUsers = new Map<string, Set<string>>();

function addOnlineUser(userId: string, socketId: string) {
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId)!.add(socketId);
}

function removeOnlineUser(userId: string, socketId: string) {
  onlineUsers.get(userId)?.delete(socketId);
  if (onlineUsers.get(userId)?.size === 0) onlineUsers.delete(userId);
}

export function isUserOnline(userId: string): boolean {
  return (onlineUsers.get(userId)?.size ?? 0) > 0;
}

export function initSocketHandlers(io: Server) {
  // ── Auth middleware ──────────────────────────────────────────────────────
  io.use(async (socket: AuthenticatedSocket, next) => {
    const userId = socket.handshake.auth?.userId;
    if (!userId) return next(new Error("No userId in auth"));

    try {
      const user = await prisma.user.findUnique({
        where:  { id: userId },
        select: { id: true, role: true, fullName: true, status: true },
      });
      if (!user || user.status !== "ACTIVE") return next(new Error("User not found"));

      socket.userId   = user.id;
      socket.userRole = user.role;
      socket.userName = user.fullName;
      next();
    } catch {
      next(new Error("Auth failed"));
    }
  });

  io.on("connection", (rawSocket) => {
    const socket = rawSocket as AuthenticatedSocket;
    const userId = socket.userId!;

    // ── Online presence ────────────────────────────────────────────────────
    addOnlineUser(userId, socket.id);
    prisma.user.update({ where: { id: userId }, data: { isOnline: true, lastSeenAt: new Date() } }).catch(() => {});
    io.emit("user:online", { userId });

    // Join user's personal notification room
    socket.join(`user:${userId}`);

    // ── Join conversation rooms ────────────────────────────────────────────
    socket.on("conversation:join", async ({ conversationId }: { conversationId: string }) => {
      const allowed = await canAccessConversation({ id: userId, role: socket.userRole! }, conversationId);
      if (!allowed) {
        socket.emit("error", { message: "Forbidden" });
        return;
      }
      socket.join(`conv:${conversationId}`);
    });

    socket.on("conversation:leave", ({ conversationId }: { conversationId: string }) => {
      socket.leave(`conv:${conversationId}`);
    });

    // ── Send message ───────────────────────────────────────────────────────
    socket.on("message:send", async (payload: {
      conversationId: string;
      content: string;
      tempId: string;
    }) => {
      const { conversationId, content, tempId } = payload;

      if (!content?.trim()) return;

      // Auth check
      const allowed = await canAccessConversation({ id: userId, role: socket.userRole! }, conversationId);
      if (!allowed) {
        socket.emit("message:error", { tempId, error: "Forbidden" });
        return;
      }

      try {
        const message = await prisma.message.create({
          data: {
            conversationId,
            senderId:    userId,
            content:     content.trim(),
            messageType: "text",
          },
          include: {
            sender: { select: { id: true, fullName: true, avatarUrl: true, role: true } },
            attachments: true,
          },
        });

        // Update conversation last message time
        await prisma.conversation.update({
          where: { id: conversationId },
          data:  { lastMessageAt: new Date(), updatedAt: new Date() },
        });

        // Broadcast to all in conversation (including sender)
        io.to(`conv:${conversationId}`).emit("message:new", {
          ...message,
          tempId,
        });

        // Send real-time notification to recipients not currently in the room
        const participants = await prisma.conversationParticipant.findMany({
          where: { conversationId, userId: { not: userId } },
          select: { userId: true },
        });

        for (const p of participants) {
          // Create DB notification
          await prisma.notification.create({
            data: {
              userId:   p.userId,
              type:     "NEW_MESSAGE",
              title:    `New message from ${socket.userName}`,
              body:     content.trim().slice(0, 80),
              link:     `/messages/${conversationId}`,
              metadata: { conversationId, senderId: userId } as any,
            },
          });
          // Push to personal room
          io.to(`user:${p.userId}`).emit("notification:new", {
            type: "NEW_MESSAGE",
            senderName: socket.userName,
            conversationId,
          });
        }
      } catch (err) {
        console.error("[Socket] message:send error:", err);
        socket.emit("message:error", { tempId, error: "Failed to send" });
      }
    });

    // ── Typing indicator ───────────────────────────────────────────────────
    socket.on("typing:start", ({ conversationId }: { conversationId: string }) => {
      socket.to(`conv:${conversationId}`).emit("typing:start", {
        userId,
        userName: socket.userName,
        conversationId,
      });
    });

    socket.on("typing:stop", ({ conversationId }: { conversationId: string }) => {
      socket.to(`conv:${conversationId}`).emit("typing:stop", {
        userId,
        conversationId,
      });
    });

    // ── Mark messages read ─────────────────────────────────────────────────
    socket.on("messages:read", async ({ conversationId }: { conversationId: string }) => {
      try {
        // Get unread message IDs
        const unread = await prisma.message.findMany({
          where: {
            conversationId,
            senderId: { not: userId },
            readReceipts: { none: { userId } },
          },
          select: { id: true },
        });

        if (unread.length === 0) return;

        await prisma.messageReadReceipt.createMany({
          data: unread.map((m) => ({ messageId: m.id, userId })),
          skipDuplicates: true,
        });

        // Update participant last read
        await prisma.conversationParticipant.updateMany({
          where: { conversationId, userId },
          data:  { lastReadAt: new Date() },
        });

        // Notify others of read
        socket.to(`conv:${conversationId}`).emit("messages:read", {
          userId,
          conversationId,
          messageIds: unread.map((m) => m.id),
        });
      } catch (err) {
        console.error("[Socket] messages:read error:", err);
      }
    });

    // ── Disconnect ─────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      removeOnlineUser(userId, socket.id);
      if (!isUserOnline(userId)) {
        prisma.user.update({
          where: { id: userId },
          data:  { isOnline: false, lastSeenAt: new Date() },
        }).catch(() => {});
        io.emit("user:offline", { userId });
      }
    });
  });
}
