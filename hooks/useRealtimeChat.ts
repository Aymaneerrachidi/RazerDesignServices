"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useSocket } from "./useSocket";
import type { Message } from "@/lib/types";

interface DBMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string | null;
  messageType: string;
  createdAt: string;
  editedAt: string | null;
  sender: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    role: string;
  };
  attachments: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  }>;
  readReceipts: Array<{ userId: string; readAt: string }>;
}

interface UseRealtimeChatReturn {
  messages: DBMessage[];
  sendMessage: (content: string) => Promise<void>;
  sendTyping: () => void;
  stopTyping: () => void;
  typingUsers: Record<string, string>;  // userId → userName
  connected: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useRealtimeChat(conversationId: string): UseRealtimeChatReturn {
  const { data: session } = useSession();
  const { socket, connected } = useSocket();

  const [messages,    setMessages]    = useState<DBMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const [isLoading,   setIsLoading]   = useState(true);
  const [error,       setError]       = useState<string | null>(null);

  const typingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const typingActive = useRef(false);
  const typingTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchMessages = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!conversationId) return;
    if (!silent) setIsLoading(true);

    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      const data = await response.json();
      if (data.success) {
        setMessages(data.data);
        setError(null);
      } else {
        setError(data.error);
      }
    } catch {
      setError("Failed to load messages");
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [conversationId]);

  // ── Fetch history ──────────────────────────────────────────────────────
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Vercel does not run the custom Socket.io server, so keep chat usable with polling.
  useEffect(() => {
    if (!conversationId || connected) return;
    const interval = setInterval(() => {
      fetchMessages({ silent: true });
    }, 5000);
    return () => clearInterval(interval);
  }, [conversationId, connected, fetchMessages]);

  // ── Socket events ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !conversationId) return;

    socket.emit("conversation:join", { conversationId });

    // Mark as read on join
    socket.emit("messages:read", { conversationId });

    const onNewMessage = (msg: DBMessage & { tempId?: string }) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      // Clear typing for this sender
      setTypingUsers((prev) => {
        const next = { ...prev };
        delete next[msg.senderId];
        return next;
      });
    };

    const onTypingStart = ({ userId, userName, conversationId: cId }: any) => {
      if (cId !== conversationId) return;
      if (userId === session?.user?.id) return;
      setTypingUsers((prev) => ({ ...prev, [userId]: userName }));
      // Auto-clear after 4s
      if (typingTimers.current[userId]) clearTimeout(typingTimers.current[userId]);
      typingTimers.current[userId] = setTimeout(() => {
        setTypingUsers((prev) => { const n = { ...prev }; delete n[userId]; return n; });
      }, 4000);
    };

    const onTypingStop = ({ userId, conversationId: cId }: any) => {
      if (cId !== conversationId) return;
      if (typingTimers.current[userId]) clearTimeout(typingTimers.current[userId]);
      setTypingUsers((prev) => { const n = { ...prev }; delete n[userId]; return n; });
    };

    const onReadReceipt = ({ userId: uid, messageIds }: any) => {
      if (uid === session?.user?.id) return;
      setMessages((prev) =>
        prev.map((m) =>
          messageIds.includes(m.id)
            ? { ...m, readReceipts: [...(m.readReceipts ?? []), { userId: uid, readAt: new Date().toISOString() }] }
            : m
        )
      );
    };

    socket.on("message:new",    onNewMessage);
    socket.on("typing:start",   onTypingStart);
    socket.on("typing:stop",    onTypingStop);
    socket.on("messages:read",  onReadReceipt);

    return () => {
      socket.off("message:new",   onNewMessage);
      socket.off("typing:start",  onTypingStart);
      socket.off("typing:stop",   onTypingStop);
      socket.off("messages:read", onReadReceipt);
      socket.emit("conversation:leave", { conversationId });
    };
  }, [socket, conversationId, session?.user?.id]);

  // ── Send message ───────────────────────────────────────────────────────
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !session?.user?.id) return;

    const tempId = `temp-${Date.now()}`;
    const optimistic: DBMessage = {
      id:             tempId,
      conversationId,
      senderId:       session.user.id,
      content:        content.trim(),
      messageType:    "text",
      createdAt:      new Date().toISOString(),
      editedAt:       null,
      sender: {
        id:        session.user.id,
        fullName:  session.user.name ?? "",
        avatarUrl: session.user.avatarUrl ?? null,
        role:      session.user.role,
      },
      attachments:  [],
      readReceipts: [],
    };

    // Optimistic update
    setMessages((prev) => [...prev, optimistic]);

    // Stop typing
    typingActive.current = false;
    if (typingTimer.current) clearTimeout(typingTimer.current);
    if (socket && connected) socket.emit("typing:stop", { conversationId });

    if (!socket || !connected) {
      try {
        const response = await fetch(`/api/conversations/${conversationId}/messages`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ content: content.trim(), tempId }),
        });
        const data = await response.json();
        if (!data.success) throw new Error(data.error ?? "Failed to send");
        setMessages((prev) => prev.map((m) => (m.id === tempId ? data.data : m)));
        setError(null);
      } catch {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setError("Failed to send message");
      }
      return;
    }

    socket.emit("message:send", { conversationId, content: content.trim(), tempId });

    // Replace temp message when real one arrives via message:new
    socket.once("message:new", (msg: DBMessage & { tempId?: string }) => {
      if (msg.tempId === tempId) {
        setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...msg } : m)));
      }
    });
  }, [connected, socket, conversationId, session?.user?.id]);

  // ── Typing ────────────────────────────────────────────────────────────
  const sendTyping = useCallback(() => {
    if (!socket || !connected || !conversationId) return;
    if (!typingActive.current) {
      typingActive.current = true;
      socket.emit("typing:start", { conversationId });
    }
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      typingActive.current = false;
      socket.emit("typing:stop", { conversationId });
    }, 2500);
  }, [connected, socket, conversationId]);

  const stopTyping = useCallback(() => {
    if (!socket || !connected) return;
    typingActive.current = false;
    if (typingTimer.current) clearTimeout(typingTimer.current);
    socket.emit("typing:stop", { conversationId });
  }, [connected, socket, conversationId]);

  return { messages, sendMessage, sendTyping, stopTyping, typingUsers, connected, isLoading, error };
}
