"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ChatView } from "@/components/chat/ChatView";
import { useAuth } from "@/lib/auth-context";

interface Conversation {
  id: string;
  otherUser: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    isOnline: boolean;
    role: string;
  };
}

export default function ArtistChatPage() {
  const { user } = useAuth();
  const [conv,    setConv]    = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((d) => {
        const convos: Conversation[] = d.data ?? [];
        // Pick the conversation with a supervisor/admin
        const supervisorConv = convos.find(
          (c) => c.otherUser?.role === "SUPERVISOR" || c.otherUser?.role === "SUPER_ADMIN"
        ) ?? convos[0] ?? null;
        setConv(supervisorConv);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!user) return null;

  const otherUser = conv?.otherUser
    ? {
        id:     conv.otherUser.id,
        name:   conv.otherUser.fullName,
        email:  "",
        passwordHash: "",
        role:   "supervisor" as const,
        avatar: conv.otherUser.avatarUrl ?? "",
        status: conv.otherUser.isOnline ? ("online" as const) : ("offline" as const),
        createdAt: "",
      }
    : null;

  return (
    <DashboardLayout
      title="Chat with Supervisor"
      subtitle="Private one-on-one channel"
      requiredRole="artist"
    >
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-neon/20 border-t-neon animate-spin" />
        </div>
      ) : conv && otherUser ? (
        <ChatView
          conversationId={conv.id}
          currentUser={user}
          otherUser={otherUser}
          privateLabel="Private"
        />
      ) : (
        <div className="card-premium rounded-2xl p-16 text-center">
          <p className="text-text-primary font-display font-bold">No conversation yet</p>
          <p className="text-text-muted font-body text-sm mt-2">
            Your supervisor will set up a conversation with you.
          </p>
        </div>
      )}
    </DashboardLayout>
  );
}
