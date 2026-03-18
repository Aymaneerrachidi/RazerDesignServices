"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ChatView } from "@/components/chat/ChatView";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth-context";

interface OtherUser {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  isOnline: boolean;
  role: string;
}

export default function SupervisorChatConvo() {
  // Route is /supervisor/chat/[artistId] but the param is actually a conversation ID
  const { artistId: convId } = useParams() as { artistId: string };
  const { user } = useAuth();

  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((d) => {
        const convs = d.data ?? [];
        const conv  = convs.find((c: any) => c.id === convId);
        if (conv?.otherUser) setOtherUser(conv.otherUser);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [convId]);

  if (!user) return null;

  const mappedOtherUser = otherUser
    ? {
        id:           otherUser.id,
        name:         otherUser.fullName,
        email:        "",
        passwordHash: "",
        role:         "artist" as const,
        avatar:       otherUser.avatarUrl ?? "",
        status:       (otherUser.isOnline ? "online" : "offline") as const,
        createdAt:    "",
      }
    : null;

  return (
    <DashboardLayout
      title={otherUser?.fullName ?? "Chat"}
      subtitle="Private Channel"
      requiredRole="supervisor"
      headerActions={
        <Link href="/supervisor/chat">
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />}>Back</Button>
        </Link>
      }
    >
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-neon/20 border-t-neon animate-spin" />
        </div>
      ) : mappedOtherUser ? (
        <ChatView
          conversationId={convId}
          currentUser={user}
          otherUser={mappedOtherUser}
          privateLabel="Private Channel"
        />
      ) : (
        <div className="text-center py-20 text-text-muted font-body">Conversation not found.</div>
      )}
    </DashboardLayout>
  );
}
