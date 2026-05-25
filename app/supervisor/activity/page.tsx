"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Activity, UserPlus, UserMinus, LogIn, LogOut, Key,
  Briefcase, FileCheck, MessageSquare, Mail, Upload,
  CheckCircle, XCircle, Clock, Filter,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Avatar } from "@/components/ui/Avatar";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface LogEntry {
  id: string;
  action: string;
  resource: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  performer: { id: string; fullName: string; avatarUrl: string | null; role: string } | null;
  user:      { id: string; fullName: string; role: string } | null;
}

type FilterTab = "all" | "mine" | "artists";

const ACTION_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  USER_CREATED:         { label: "User created",          icon: <UserPlus  size={13} />, color: "text-neon" },
  USER_UPDATED:         { label: "User updated",          icon: <UserPlus  size={13} />, color: "text-blue-400" },
  USER_DEACTIVATED:     { label: "Artist removed",        icon: <UserMinus size={13} />, color: "text-red-400" },
  USER_ACTIVATED:       { label: "User activated",        icon: <CheckCircle size={13} />, color: "text-neon" },
  USER_DELETED:         { label: "User deleted",          icon: <XCircle  size={13} />, color: "text-red-400" },
  USER_LOGIN:           { label: "Logged in",             icon: <LogIn    size={13} />, color: "text-text-muted" },
  USER_LOGOUT:          { label: "Logged out",            icon: <LogOut   size={13} />, color: "text-text-muted" },
  PASSWORD_CHANGED:     { label: "Password changed",      icon: <Key      size={13} />, color: "text-amber-400" },
  ASSIGNMENT_CREATED:   { label: "Assignment created",    icon: <Briefcase size={13} />, color: "text-neon" },
  ASSIGNMENT_UPDATED:   { label: "Assignment updated",    icon: <Briefcase size={13} />, color: "text-blue-400" },
  ASSIGNMENT_DELETED:   { label: "Assignment deleted",    icon: <Briefcase size={13} />, color: "text-red-400" },
  SUBMISSION_CREATED:   { label: "Submission uploaded",   icon: <Upload   size={13} />, color: "text-neon" },
  SUBMISSION_REVIEWED:  { label: "Submission reviewed",   icon: <FileCheck size={13} />, color: "text-amber-400" },
  MESSAGE_SENT:         { label: "Message sent",          icon: <MessageSquare size={13} />, color: "text-text-muted" },
  INVITE_SENT:          { label: "Invite sent",           icon: <Mail     size={13} />, color: "text-neon" },
  INVITE_ACCEPTED:      { label: "Invite accepted",       icon: <CheckCircle size={13} />, color: "text-neon" },
  FILE_UPLOADED:        { label: "File uploaded",         icon: <Upload   size={13} />, color: "text-blue-400" },
};

export default function ActivityPage() {
  const [logs,    setLogs]    = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState<FilterTab>("all");
  const [page,    setPage]    = useState(1);
  const [pages,   setPages]   = useState(1);
  const [total,   setTotal]   = useState(0);

  const fetchLogs = useCallback(async (f: FilterTab, p: number) => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/audit-logs?filter=${f}&page=${p}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setLogs(data.data.logs);
        setPages(data.data.pages);
        setTotal(data.data.total);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchLogs(filter, page); }, [filter, page, fetchLogs]);

  const changeFilter = (f: FilterTab) => {
    setFilter(f);
    setPage(1);
  };

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all",     label: "All Activity" },
    { key: "mine",    label: "My Actions"   },
    { key: "artists", label: "Artists"      },
  ];

  return (
    <DashboardLayout title="Activity Log" subtitle="Full audit trail of your team" requiredRole="supervisor">

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-6 bg-white/3 border border-[var(--border)] rounded-xl p-1 w-fit">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => changeFilter(t.key)}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-display font-semibold transition-all",
              filter === t.key
                ? "bg-neon/15 text-neon border border-neon/20"
                : "text-text-muted hover:text-text-primary"
            )}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-2 mb-4">
        <Activity size={13} className="text-text-muted" />
        <p className="text-xs text-text-muted font-mono">{total} total events</p>
      </div>

      {/* Log list */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-neon/20 border-t-neon animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="card-premium rounded-2xl p-16 text-center">
          <Filter size={36} className="text-text-muted mx-auto mb-4" />
          <p className="text-text-primary font-display font-bold">No activity yet</p>
          <p className="text-text-muted font-body text-sm mt-2">Actions will appear here as your team works.</p>
        </div>
      ) : (
        <div className="card-premium rounded-2xl overflow-hidden">
          <div className="neon-line" />
          {logs.map((log, i) => {
            const meta  = ACTION_META[log.action] ?? { label: log.action, icon: <Activity size={13} />, color: "text-text-muted" };
            return (
              <div key={log.id}
                className={cn("flex items-start gap-4 px-5 py-3.5 hover:bg-white/2 transition-colors",
                  i < logs.length - 1 && "border-b border-[var(--border)]"
                )}>
                {/* Icon */}
                <div className={cn("w-7 h-7 rounded-lg bg-white/5 border border-[var(--border)] flex items-center justify-center flex-shrink-0 mt-0.5", meta.color)}>
                  {meta.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold font-display text-text-primary">{meta.label}</span>
                    {log.user && log.user.id !== log.performer?.id && (
                      <span className="text-2xs text-text-muted font-body">
                        → <span className="text-text-secondary">{log.user.fullName}</span>
                      </span>
                    )}
                    {log.resource && (
                      <span className="text-2xs font-mono text-text-muted bg-white/3 px-1.5 py-0.5 rounded border border-[var(--border)] truncate max-w-[200px]">
                        {log.resource}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {log.performer && (
                      <div className="flex items-center gap-1.5">
                        <Avatar name={log.performer.fullName} avatar={log.performer.avatarUrl ?? undefined} size="xs" />
                        <span className="text-2xs text-text-muted font-body">{log.performer.fullName}</span>
                        <span className="text-2xs text-text-muted font-mono opacity-50 capitalize">
                          ({log.performer.role.toLowerCase()})
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Time */}
                <div className="flex items-center gap-1 flex-shrink-0 mt-1">
                  <Clock size={10} className="text-text-muted" />
                  <span className="text-2xs text-text-muted font-mono">{formatRelativeTime(log.createdAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 text-2xs font-mono text-text-muted border border-[var(--border)] rounded-lg hover:bg-white/5 disabled:opacity-30 transition-colors">
            ← Prev
          </button>
          <span className="text-2xs font-mono text-text-muted">Page {page} / {pages}</span>
          <button disabled={page === pages} onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 text-2xs font-mono text-text-muted border border-[var(--border)] rounded-lg hover:bg-white/5 disabled:opacity-30 transition-colors">
            Next →
          </button>
        </div>
      )}
    </DashboardLayout>
  );
}
