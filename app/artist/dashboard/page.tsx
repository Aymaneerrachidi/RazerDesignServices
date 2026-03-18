"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Briefcase, MessageSquare, Upload, Clock,
  CheckCircle, AlertCircle, ArrowRight,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/Card";
import { StatusBadge, PriorityBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth-context";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Stats {
  activeAssignments: number;
  submittedCount: number;
  approvedCount: number;
  revisionCount: number;
}

interface ApiAssignment {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  deadlineUtc: string;
  referenceNotes: string | null;
}

function normStatus(s: string) { return s.toLowerCase().replace("_", "-") as any; }
function normPriority(p: string) { return p.toLowerCase() as any; }
function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

export default function ArtistDashboard() {
  const { user } = useAuth();
  const [stats,       setStats]       = useState<Stats | null>(null);
  const [assignments, setAssignments] = useState<ApiAssignment[]>([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/stats").then((r) => r.json()),
      fetch("/api/assignments").then((r) => r.json()),
    ])
      .then(([statsRes, assignRes]) => {
        setStats(statsRes.data ?? null);
        setAssignments(assignRes.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const activeAssignments = assignments.filter((a) =>
    ["PENDING", "IN_PROGRESS"].includes(a.status)
  );
  const revisionAssignments = assignments.filter((a) => a.status === "REVISION");
  const totalAssignments = assignments.length;
  const approvedCount = assignments.filter((a) => a.status === "APPROVED").length;

  return (
    <DashboardLayout
      title={`Welcome, ${user?.name?.split(" ")[0] ?? "Artist"}`}
      subtitle="Your personal artist workspace"
      requiredRole="artist"
    >
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-neon/20 border-t-neon animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Active Jobs"   value={stats?.activeAssignments ?? 0} icon={<Briefcase size={18} />} color="amber"  />
            <StatCard label="Completed"     value={stats?.approvedCount ?? 0}     icon={<CheckCircle size={18} />} color="neon" />
            <StatCard label="Under Review"  value={stats?.submittedCount ?? 0}    icon={<Upload size={18} />}      color="violet" />
            <StatCard label="Need Revision" value={stats?.revisionCount ?? 0}     icon={<AlertCircle size={18} />}
              color={(stats?.revisionCount ?? 0) > 0 ? "red" : "blue"} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Active Assignments */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-display font-bold text-text-primary">My Assignments</h2>
                <Link href="/artist/assignments" className="text-xs text-neon hover:text-neon-bright transition-colors font-display flex items-center gap-1">
                  All <ArrowRight size={12} />
                </Link>
              </div>

              {activeAssignments.length === 0 ? (
                <div className="card-premium rounded-2xl p-12 text-center">
                  <Briefcase size={32} className="text-text-muted mx-auto mb-3" />
                  <p className="text-text-primary font-display font-bold">No active assignments</p>
                  <p className="text-sm text-text-muted font-body mt-1">Check back soon — new work is on its way.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeAssignments.map((a, i) => {
                    const daysLeft  = daysUntil(a.deadlineUtc);
                    const isUrgent  = daysLeft <= 3 && daysLeft >= 0;
                    const isOverdue = daysLeft < 0;
                    return (
                      <Link key={a.id} href={`/artist/assignments/${a.id}`}>
                        <div className="card-premium rounded-xl p-5 cursor-pointer hover:border-[rgba(0,232,122,0.2)] hover:shadow-card-hover transition-all duration-300 group"
                          style={{ animationDelay: `${i * 60}ms` }}>
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <h3 className="text-sm font-display font-bold text-text-primary group-hover:text-neon transition-colors">{a.title}</h3>
                            <StatusBadge status={normStatus(a.status)} />
                          </div>
                          <p className="text-xs text-text-secondary font-body line-clamp-2 mb-3">{a.description}</p>
                          <div className="flex items-center justify-between">
                            <PriorityBadge priority={normPriority(a.priority)} />
                            <div className="flex items-center gap-3">
                              <span className={cn("text-xs font-mono flex items-center gap-1",
                                isOverdue ? "text-red-400" : isUrgent ? "text-amber-400" : "text-text-muted")}>
                                <Clock size={11} />
                                {isOverdue ? `${Math.abs(daysLeft)}d overdue` : `Due ${formatDate(a.deadlineUtc)}`}
                              </span>
                              <span className="text-neon text-sm group-hover:translate-x-1 transition-transform">›</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Revision needed */}
              {revisionAssignments.length > 0 && (
                <div>
                  <h2 className="text-lg font-display font-bold text-text-primary mb-3 flex items-center gap-2">
                    <AlertCircle size={18} className="text-red-400" /> Revision Needed
                  </h2>
                  {revisionAssignments.map((a) => (
                    <Link key={a.id} href={`/artist/assignments/${a.id}`}>
                      <div className="card-premium rounded-xl p-4 border-red-500/20 bg-red-500/3 cursor-pointer hover:border-red-500/35 transition-all">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-display font-bold text-text-primary">{a.title}</p>
                          <StatusBadge status="revision" />
                        </div>
                        {a.referenceNotes && (
                          <p className="text-xs text-text-muted font-body mt-1 line-clamp-1">{a.referenceNotes}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Right column */}
            <div className="space-y-5">
              {/* Quick actions */}
              <div className="card-premium rounded-2xl p-4 space-y-2">
                <h2 className="text-sm font-display font-bold text-text-primary mb-3">Quick Actions</h2>
                {[
                  { label: "Submit Artwork",     href: "/artist/submit",      icon: <Upload size={14} />,         color: "text-neon" },
                  { label: "View All Work",      href: "/artist/assignments", icon: <Briefcase size={14} />,      color: "text-blue-400" },
                  { label: "Submission History", href: "/artist/submissions", icon: <CheckCircle size={14} />,    color: "text-violet-400" },
                  { label: "Message Supervisor", href: "/artist/chat",        icon: <MessageSquare size={14} />,  color: "text-amber-400" },
                ].map((action) => (
                  <Link key={action.href} href={action.href}>
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/3 transition-colors cursor-pointer group">
                      <span className={cn("w-7 h-7 rounded-lg bg-white/4 flex items-center justify-center", action.color)}>
                        {action.icon}
                      </span>
                      <span className="text-sm font-display font-medium text-text-secondary group-hover:text-text-primary transition-colors">
                        {action.label}
                      </span>
                      <ArrowRight size={13} className="ml-auto text-text-muted group-hover:text-text-primary transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>

              {/* Progress */}
              <div className="card-premium rounded-2xl p-4">
                <h2 className="text-sm font-display font-bold text-text-primary mb-3">Progress</h2>
                <div className="space-y-3">
                  {[
                    { label: "Assignments", value: approvedCount, total: totalAssignments, color: "#00E87A" },
                    { label: "Submissions", value: stats?.approvedCount ?? 0, total: (stats?.submittedCount ?? 0) + (stats?.approvedCount ?? 0), color: "#8B5CF6" },
                  ].map((item) => {
                    const pct = item.total > 0 ? (item.value / item.total) * 100 : 0;
                    return (
                      <div key={item.label}>
                        <div className="flex justify-between mb-1.5">
                          <span className="text-xs text-text-muted font-body">{item.label}</span>
                          <span className="text-xs font-mono text-text-secondary">{item.value}/{item.total}</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: item.color, boxShadow: `0 0 8px ${item.color}60` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Open chat */}
              <Link href="/artist/chat">
                <div className="card-premium rounded-2xl p-4">
                  <div className="neon-line" />
                  <div className="flex items-center gap-3 mt-2">
                    <div className="w-10 h-10 rounded-xl bg-neon/10 flex items-center justify-center">
                      <MessageSquare size={18} className="text-neon" />
                    </div>
                    <div>
                      <p className="text-sm font-display font-bold text-text-primary">Chat with Supervisor</p>
                      <p className="text-xs text-text-muted font-body">Send a message</p>
                    </div>
                    <ArrowRight size={14} className="ml-auto text-text-muted" />
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
