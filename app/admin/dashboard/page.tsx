"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users, Briefcase, Upload, CheckCircle, Shield,
  ScrollText, UserPlus, TrendingUp, ArrowRight, Clock,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { formatRelativeTime } from "@/lib/utils";

interface AdminStats {
  totalUsers: number;
  totalSupervisors: number;
  totalArtists: number;
  totalAssignments: number;
  pendingSubmissions: number;
  activeAssignments: number;
  approvedAssignments: number;
  recentAuditLogs: Array<{
    id: string;
    action: string;
    createdAt: string;
    performer: { id: string; fullName: string; role: string } | null;
    user: { id: string; fullName: string } | null;
  }>;
}

const ACTION_LABEL: Record<string, string> = {
  USER_LOGIN:         "User logged in",
  USER_LOGOUT:        "User logged out",
  USER_CREATED:       "Account created",
  USER_UPDATED:       "User updated",
  USER_DEACTIVATED:   "User deactivated",
  ASSIGNMENT_CREATED: "Assignment created",
  ASSIGNMENT_UPDATED: "Assignment updated",
  SUBMISSION_CREATED: "Submission submitted",
  SUBMISSION_REVIEWED:"Submission reviewed",
  INVITE_SENT:        "Invite sent",
  PASSWORD_CHANGED:   "Password changed",
  FILE_UPLOADED:      "File uploaded",
};

export default function AdminDashboard() {
  const [stats,   setStats]   = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => setStats(d.data ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout
      title="Super Admin"
      subtitle="Platform overview and management"
      requiredRole="super_admin"
      headerActions={
        <Link href="/admin/invites">
          <Button size="sm" icon={<UserPlus size={14} />}>Send Invite</Button>
        </Link>
      }
    >
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-neon/20 border-t-neon animate-spin" />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Total Users"
              value={stats?.totalUsers ?? 0}
              icon={<Users size={18} />}
              color="neon"
            />
            <StatCard
              label="Supervisors"
              value={stats?.totalSupervisors ?? 0}
              icon={<Shield size={18} />}
              color="amber"
            />
            <StatCard
              label="Artists"
              value={stats?.totalArtists ?? 0}
              icon={<Users size={18} />}
              color="blue"
            />
            <StatCard
              label="Assignments"
              value={stats?.totalAssignments ?? 0}
              icon={<Briefcase size={18} />}
              color="violet"
            />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Active"
              value={stats?.activeAssignments ?? 0}
              icon={<TrendingUp size={18} />}
              color="amber"
            />
            <StatCard
              label="Pending Review"
              value={stats?.pendingSubmissions ?? 0}
              icon={<Upload size={18} />}
              color="violet"
            />
            <StatCard
              label="Approved"
              value={stats?.approvedAssignments ?? 0}
              icon={<CheckCircle size={18} />}
              color="neon"
            />
            <Link href="/admin/audit-logs">
              <div className="card-premium rounded-xl p-4 h-full flex flex-col justify-between hover:border-amber-400/20 transition-all cursor-pointer group">
                <div className="flex items-center justify-between">
                  <ScrollText size={18} className="text-amber-400" />
                  <ArrowRight size={14} className="text-text-muted group-hover:text-amber-400 transition-colors" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-display text-text-primary mt-3">Logs</p>
                  <p className="text-xs text-text-muted font-body mt-1">Audit trail</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
            {[
              { label: "Manage Supervisors", href: "/admin/supervisors", icon: <Shield size={16} />, color: "text-amber-400", bg: "bg-amber-400/8 border-amber-400/15", desc: "View and manage supervisor accounts" },
              { label: "Manage Artists",     href: "/admin/artists",     icon: <Users size={16} />,  color: "text-blue-400",  bg: "bg-blue-400/8 border-blue-400/15",  desc: "View all artist accounts" },
              { label: "All Assignments",    href: "/admin/assignments", icon: <Briefcase size={16} />, color: "text-neon", bg: "bg-neon/8 border-neon/15",   desc: "Browse and manage all assignments" },
            ].map((link) => (
              <Link key={link.href} href={link.href}>
                <div className={`card-premium rounded-xl p-5 border cursor-pointer hover:opacity-90 transition-all group ${link.bg}`}>
                  <div className={`w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center mb-3 ${link.color}`}>
                    {link.icon}
                  </div>
                  <p className="text-sm font-display font-bold text-text-primary group-hover:text-text-primary">{link.label}</p>
                  <p className="text-xs text-text-muted font-body mt-1">{link.desc}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Recent audit logs */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display font-bold text-text-primary tracking-wide">Recent Activity</h2>
              <Link href="/admin/audit-logs" className="text-xs text-neon hover:text-neon-bright transition-colors font-display flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </div>
            <div className="card-premium rounded-xl overflow-hidden">
              {(stats?.recentAuditLogs ?? []).map((log, i) => (
                <div
                  key={log.id}
                  className="flex items-center gap-4 px-4 py-3 border-b border-[var(--border)] last:border-0 hover:bg-white/2 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-neon/8 flex items-center justify-center flex-shrink-0">
                    <ScrollText size={14} className="text-neon" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold font-display text-text-primary">
                      {ACTION_LABEL[log.action] ?? log.action}
                    </p>
                    <p className="text-2xs text-text-muted font-body mt-0.5">
                      by {log.performer?.fullName ?? "System"}
                      {log.user && log.user.id !== log.performer?.id && ` → ${log.user.fullName}`}
                    </p>
                  </div>
                  <span className="text-2xs text-text-muted font-mono flex items-center gap-1 flex-shrink-0">
                    <Clock size={10} />
                    {formatRelativeTime(log.createdAt)}
                  </span>
                </div>
              ))}
              {(stats?.recentAuditLogs?.length ?? 0) === 0 && (
                <div className="px-4 py-8 text-center text-text-muted text-sm">No activity yet</div>
              )}
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
