"use client";

import { useState, useEffect } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  link: string | null;
}

const TYPE_ICON: Record<string, string> = {
  MESSAGE: "💬", NEW_MESSAGE: "💬",
  SUBMISSION: "📤", NEW_SUBMISSION: "📤",
  ASSIGNMENT: "📋", NEW_ASSIGNMENT: "📋",
  FEEDBACK: "✏️",
};

export default function NotificationsPage() {
  const [notifs,  setNotifs]  = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = () => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => setNotifs(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchNotifs(); }, []);

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" }).catch(() => {});
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH" }).catch(() => {});
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const unreadCount = notifs.filter((n) => !n.isRead).length;

  return (
    <DashboardLayout
      title="Notifications"
      subtitle={unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
      requiredRole="supervisor"
      headerActions={
        unreadCount > 0 ? (
          <Button variant="ghost" size="sm" icon={<CheckCheck size={14} />} onClick={markAllRead}>
            Mark all read
          </Button>
        ) : undefined
      }
    >
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-neon/20 border-t-neon animate-spin" />
        </div>
      ) : notifs.length === 0 ? (
        <div className="card-premium rounded-2xl p-16 text-center">
          <Bell size={40} className="text-text-muted mx-auto mb-4" />
          <p className="text-text-primary font-display font-bold text-lg">No notifications</p>
          <p className="text-text-muted font-body text-sm mt-2">You're all caught up!</p>
        </div>
      ) : (
        <div className="card-premium rounded-2xl overflow-hidden">
          <div className="neon-line" />
          {notifs.map((n, i) => (
            <div
              key={n.id}
              onClick={() => !n.isRead && markRead(n.id)}
              className={cn(
                "flex gap-4 px-5 py-4 cursor-pointer hover:bg-white/2 transition-colors",
                i < notifs.length - 1 && "border-b border-[var(--border)]",
                !n.isRead && "bg-neon/3"
              )}
            >
              <span className="text-xl flex-shrink-0 mt-0.5">{TYPE_ICON[n.type] ?? "🔔"}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-display font-bold text-text-primary">{n.title}</p>
                  {!n.isRead && <span className="w-2 h-2 rounded-full bg-neon flex-shrink-0 mt-1.5" />}
                </div>
                <p className="text-xs text-text-secondary font-body mt-1 line-clamp-2">{n.body}</p>
                <p className="text-2xs text-text-muted font-mono mt-2">{formatRelativeTime(n.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
