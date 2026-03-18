"use client";

import { useState, useEffect } from "react";
import { Bell, Menu } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Avatar } from "@/components/ui/Avatar";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onMenuClick?: () => void;
  actions?: React.ReactNode;
}

interface Notif {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  type: string;
  createdAt: string;
}

export function Header({ title, subtitle, onMenuClick, actions }: HeaderProps) {
  const { user } = useAuth();
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifs, setNotifs]         = useState<Notif[]>([]);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => setNotifs(d.data ?? []))
      .catch(() => {});
  }, []);

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" }).catch(() => {});
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const unread = notifs.filter((n) => !n.isRead).length;

  const typeIcon: Record<string, string> = {
    MESSAGE:       "💬",
    SUBMISSION:    "📤",
    ASSIGNMENT:    "📋",
    FEEDBACK:      "✏️",
    NEW_SUBMISSION: "📤",
    NEW_ASSIGNMENT: "📋",
  };

  return (
    <header className="fixed top-0 left-0 right-0 md:left-[260px] h-16 z-30 glass border-b border-[var(--border)] flex items-center px-4 md:px-6 gap-4">
      <button onClick={onMenuClick}
        className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-white/5 transition-all">
        <Menu size={18} />
      </button>

      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-bold font-display tracking-wide text-text-primary leading-none truncate">{title}</h1>
        {subtitle && <p className="text-xs text-text-muted font-body mt-0.5 truncate">{subtitle}</p>}
      </div>

      {actions && <div className="hidden md:flex items-center gap-2">{actions}</div>}

      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="relative">
          <button onClick={() => setShowNotifs(!showNotifs)}
            className="relative w-9 h-9 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-white/5 transition-all">
            <Bell size={17} />
            {unread > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-neon" />}
          </button>

          {showNotifs && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />
              <div className="absolute right-0 top-full mt-2 w-80 glass rounded-xl border border-[var(--border)] shadow-card z-50 overflow-hidden"
                style={{ animation: "slideUp 0.2s ease-out" }}>
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                  <p className="text-sm font-bold font-display text-text-primary">Notifications</p>
                  {unread > 0 && <span className="badge-count">{unread}</span>}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifs.length === 0 ? (
                    <div className="px-4 py-8 text-center text-text-muted text-sm">No notifications</div>
                  ) : (
                    notifs.map((n) => (
                      <div key={n.id} onClick={() => markRead(n.id)}
                        className={cn(
                          "flex gap-3 px-4 py-3 border-b border-[var(--border)] last:border-0 hover:bg-white/2 transition-colors cursor-pointer",
                          !n.isRead && "bg-neon/3"
                        )}>
                        <span className="text-base flex-shrink-0 mt-0.5">{typeIcon[n.type] ?? "🔔"}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-text-primary font-display truncate">{n.title}</p>
                            {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-neon flex-shrink-0" />}
                          </div>
                          <p className="text-xs text-text-secondary mt-0.5 font-body line-clamp-1">{n.body}</p>
                          <p className="text-2xs text-text-muted mt-1 font-mono">{formatRelativeTime(n.createdAt)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <Avatar name={user?.name ?? ""} avatar={user?.avatar} status={user?.status} size="sm" showStatus className="cursor-pointer" />
      </div>
    </header>
  );
}
