"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageSquare, Search, Plus, X } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  unreadCount: number;
  lastMessageAt: string;
  otherUser: { id: string; fullName: string; avatarUrl: string | null; isOnline: boolean };
  messages: Array<{ content: string }>;
}

interface Artist {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  specialty: string | null;
  isOnline: boolean;
}

export default function SupervisorChatPage() {
  const router = useRouter();
  const [convos,    setConvos]    = useState<Conversation[]>([]);
  const [search,    setSearch]    = useState("");
  const [loading,   setLoading]   = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [artists,   setArtists]   = useState<Artist[]>([]);
  const [starting,  setStarting]  = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((d) => setConvos(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openPicker = () => {
    setShowPicker(true);
    if (artists.length === 0) {
      fetch("/api/users")
        .then((r) => r.json())
        .then((d) => setArtists(d.data ?? []))
        .catch(() => {});
    }
  };

  const startConversation = async (artistId: string) => {
    setStarting(artistId);
    try {
      const res  = await fetch("/api/conversations", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ targetUserId: artistId }),
      });
      const data = await res.json();
      if (res.ok && data.data?.id) {
        router.push(`/supervisor/chat/${data.data.id}`);
      }
    } catch {}
    setStarting(null);
  };

  const filtered = convos.filter((c) =>
    c.otherUser?.fullName.toLowerCase().includes(search.toLowerCase())
  );
  const totalUnread = convos.reduce((a, c) => a + c.unreadCount, 0);

  // Artists not already in a conversation
  const existingUserIds = new Set(convos.map((c) => c.otherUser?.id));
  const newArtists = artists.filter((a) => !existingUserIds.has(a.id));

  return (
    <DashboardLayout
      title="Messages"
      subtitle={totalUnread > 0 ? `${totalUnread} unread messages` : "All caught up"}
      requiredRole="supervisor"
      headerActions={
        <Button size="sm" icon={<Plus size={14} />} onClick={openPicker}>
          New Message
        </Button>
      }
    >
      {/* Artist picker modal */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm card-premium rounded-2xl overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.7)]">
            <div className="neon-line" />
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-display font-bold text-text-primary">Start a conversation</h3>
                <button onClick={() => setShowPicker(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-white/5 transition-all">
                  <X size={14} />
                </button>
              </div>

              {artists.length === 0 ? (
                <div className="text-center py-8 text-text-muted text-sm font-body">
                  No artists found. Add artists first.
                </div>
              ) : (
                <div className="space-y-1 max-h-72 overflow-y-auto">
                  {artists.map((artist) => (
                    <button
                      key={artist.id}
                      onClick={() => startConversation(artist.id)}
                      disabled={starting === artist.id}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/4 transition-colors text-left disabled:opacity-50"
                    >
                      <Avatar
                        name={artist.fullName}
                        avatar={artist.avatarUrl ?? undefined}
                        size="sm"
                        showStatus
                        status={artist.isOnline ? "online" : "offline"}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-display font-semibold text-text-primary truncate">{artist.fullName}</p>
                        {artist.specialty && (
                          <p className="text-2xs text-text-muted font-body truncate">{artist.specialty}</p>
                        )}
                      </div>
                      {starting === artist.id && (
                        <div className="w-4 h-4 rounded-full border-2 border-neon/20 border-t-neon animate-spin flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 max-w-md">
        <Input
          placeholder="Search conversations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search size={15} />}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-neon/20 border-t-neon animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-premium rounded-2xl p-16 text-center">
          <MessageSquare size={40} className="text-text-muted mx-auto mb-4" />
          <p className="text-text-primary font-display font-bold text-lg">No conversations</p>
          <p className="text-text-muted font-body text-sm mt-2 mb-6">Start by messaging one of your artists.</p>
          <Button icon={<Plus size={14} />} onClick={openPicker}>New Message</Button>
        </div>
      ) : (
        <div className="card-premium rounded-2xl overflow-hidden">
          <div className="neon-line" />
          {filtered.map((conv, i) => (
            <Link key={conv.id} href={`/supervisor/chat/${conv.id}`}>
              <div className={cn(
                "flex items-center gap-4 px-4 py-4 cursor-pointer hover:bg-white/2 transition-colors group",
                i < filtered.length - 1 && "border-b border-[var(--border)]"
              )}>
                <Avatar
                  name={conv.otherUser?.fullName ?? "?"}
                  avatar={conv.otherUser?.avatarUrl ?? undefined}
                  size="md"
                  showStatus
                  status={conv.otherUser?.isOnline ? "online" : "offline"}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-display font-bold text-text-primary group-hover:text-neon transition-colors">
                      {conv.otherUser?.fullName}
                    </p>
                    <span className="text-2xs text-text-muted font-mono">
                      {formatRelativeTime(conv.lastMessageAt)}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted font-body truncate">
                    {conv.messages?.[0]?.content ?? "Start a conversation..."}
                  </p>
                </div>
                {conv.unreadCount > 0 && (
                  <span className="badge-count flex-shrink-0">{conv.unreadCount}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
