"use client";

import { useState, useEffect, useCallback } from "react";
import { ScrollText, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { formatRelativeTime } from "@/lib/utils";

interface AuditLog {
  id: string;
  action: string;
  resource: string | null;
  metadata: any;
  createdAt: string;
  performer: { id: string; fullName: string; role: string } | null;
  user:      { id: string; fullName: string } | null;
}

const ACTION_LABEL: Record<string, string> = {
  USER_LOGIN:         "Login",
  USER_LOGOUT:        "Logout",
  USER_CREATED:       "Account Created",
  USER_UPDATED:       "User Updated",
  USER_DEACTIVATED:   "User Deactivated",
  ASSIGNMENT_CREATED: "Assignment Created",
  ASSIGNMENT_UPDATED: "Assignment Updated",
  SUBMISSION_CREATED: "Submission Submitted",
  SUBMISSION_REVIEWED:"Submission Reviewed",
  INVITE_SENT:        "Invite Sent",
  PASSWORD_CHANGED:   "Password Changed",
  FILE_UPLOADED:      "File Uploaded",
};

const ACTION_COLOR: Record<string, string> = {
  USER_LOGIN:         "text-neon bg-neon/8",
  USER_LOGOUT:        "text-text-muted bg-white/5",
  USER_CREATED:       "text-blue-400 bg-blue-400/8",
  ASSIGNMENT_CREATED: "text-violet-400 bg-violet-400/8",
  SUBMISSION_CREATED: "text-amber-400 bg-amber-400/8",
  SUBMISSION_REVIEWED:"text-neon bg-neon/8",
  INVITE_SENT:        "text-blue-400 bg-blue-400/8",
  PASSWORD_CHANGED:   "text-red-400 bg-red-400/8",
  FILE_UPLOADED:      "text-violet-400 bg-violet-400/8",
};

export default function AdminAuditLogsPage() {
  const [logs,    setLogs]    = useState<AuditLog[]>([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 50;

  const fetchLogs = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/audit-logs?page=${page}&limit=${limit}`)
      .then((r) => r.json())
      .then((d) => {
        setLogs(d.data?.logs ?? []);
        setTotal(d.data?.total ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const totalPages = Math.ceil(total / limit);

  return (
    <DashboardLayout
      title="Audit Logs"
      subtitle={`${total} total events`}
      requiredRole="super_admin"
    >
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-neon/20 border-t-neon animate-spin" />
        </div>
      ) : (
        <>
          <div className="card-premium rounded-xl overflow-hidden mb-4">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="px-4 py-3 text-2xs font-bold font-display tracking-widest uppercase text-text-muted">Action</th>
                  <th className="px-4 py-3 text-2xs font-bold font-display tracking-widest uppercase text-text-muted hidden md:table-cell">Performed By</th>
                  <th className="px-4 py-3 text-2xs font-bold font-display tracking-widest uppercase text-text-muted hidden lg:table-cell">Target</th>
                  <th className="px-4 py-3 text-2xs font-bold font-display tracking-widest uppercase text-text-muted">When</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-[var(--border)] last:border-0 hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-2xs font-mono font-bold ${ACTION_COLOR[log.action] ?? "text-text-muted bg-white/5"}`}>
                        {ACTION_LABEL[log.action] ?? log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-xs font-display text-text-primary">{log.performer?.fullName ?? "System"}</p>
                      {log.performer && (
                        <p className="text-2xs text-text-muted font-mono">{log.performer.role}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {log.user && log.user.id !== log.performer?.id ? (
                        <p className="text-xs text-text-secondary font-body">{log.user.fullName}</p>
                      ) : log.resource ? (
                        <p className="text-xs text-text-muted font-mono">{log.resource}</p>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-text-muted font-mono flex items-center gap-1">
                        <Clock size={10} />
                        {formatRelativeTime(log.createdAt)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {logs.length === 0 && (
              <div className="px-4 py-12 text-center text-text-muted">
                <ScrollText size={32} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm">No audit logs yet</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-text-muted font-body">
                Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={15} />
                </button>
                <span className="text-xs text-text-primary font-mono px-2">{page} / {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
