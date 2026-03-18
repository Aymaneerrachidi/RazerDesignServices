"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users, Briefcase, Upload, CheckCircle,
  MessageSquare, ArrowRight, Clock, AlertCircle,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/Card";
import { StatusBadge, PriorityBadge } from "@/components/ui/StatusBadge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Stats {
  totalArtists: number;
  activeAssignments: number;
  pendingSubmissions: number;
  approvedAssignments: number;
  unreadMessages: number;
}

interface ApiAssignment {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  deadlineUtc: string;
  artist: { id: string; fullName: string; avatarUrl: string | null } | null;
}

interface ApiConversation {
  id: string;
  unreadCount: number;
  lastMessageAt: string;
  otherUser: { id: string; fullName: string; avatarUrl: string | null; isOnline: boolean };
}

function normStatus(s: string) { return s.toLowerCase().replace("_", "-") as any; }
function normPriority(p: string) { return p.toLowerCase() as any; }

function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

export default function SupervisorDashboard() {
  const [stats,       setStats]       = useState<Stats | null>(null);
  const [assignments, setAssignments] = useState<ApiAssignment[]>([]);
  const [convos,      setConvos]      = useState<ApiConversation[]>([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/stats").then((r) => r.json()),
      fetch("/api/assignments").then((r) => r.json()),
      fetch("/api/conversations").then((r) => r.json()),
    ])
      .then(([statsRes, assignRes, convoRes]) => {
        setStats(statsRes.data ?? null);
        setAssignments((assignRes.data ?? []).slice(0, 4));
        setConvos((convoRes.data ?? []).slice(0, 3));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const activeAssignments = assignments.filter(
    (a) => ["PENDING", "IN_PROGRESS"].includes(a.status)
  );

  return (
    <DashboardLayout
      title="Command Center"
      subtitle="Welcome back, here's your studio overview"
      requiredRole="supervisor"
      headerActions={
        <Link href="/supervisor/assignments/create">
          <Button size="sm" icon={<Briefcase size={14} />}>New Assignment</Button>
        </Link>
      }
    >
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-neon/20 border-t-neon animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Artists"   value={stats?.totalArtists ?? 0}        icon={<Users size={18} />}       color="neon"   />
            <StatCard label="Active Jobs"     value={stats?.activeAssignments ?? 0}    icon={<Briefcase size={18} />}   color="amber"  />
            <StatCard label="Awaiting Review" value={stats?.pendingSubmissions ?? 0}   icon={<Upload size={18} />}      color="violet" />
            <StatCard label="Completed"       value={stats?.approvedAssignments ?? 0}  icon={<CheckCircle size={18} />} color="blue"   />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Active Assignments */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-display font-bold text-text-primary tracking-wide">Active Assignments</h2>
                <Link href="/supervisor/assignments" className="text-xs text-neon hover:text-neon-bright transition-colors font-display tracking-wider flex items-center gap-1">
                  View all <ArrowRight size={12} />
                </Link>
              </div>

              {activeAssignments.length === 0 ? (
                <div className="card-premium rounded-xl p-10 text-center">
                  <CheckCircle size={28} className="text-neon mx-auto mb-2" />
                  <p className="text-text-muted text-sm font-body">No active assignments</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeAssignments.map((a, i) => {
                    const daysLeft  = daysUntil(a.deadlineUtc);
                    const isOverdue = daysLeft < 0;
                    const isUrgent  = daysLeft <= 3 && daysLeft >= 0;
                    return (
                      <Link key={a.id} href={`/supervisor/assignments/${a.id}`}>
                        <div className="card-premium rounded-xl p-4 cursor-pointer hover:border-[rgba(0,232,122,0.2)] hover:shadow-card-hover transition-all duration-300 group"
                          style={{ animationDelay: `${i * 60}ms` }}>
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h3 className="text-sm font-semibold font-display text-text-primary group-hover:text-neon transition-colors truncate">
                                  {a.title}
                                </h3>
                                <StatusBadge status={normStatus(a.status)} />
                              </div>
                              <p className="text-xs text-text-secondary font-body line-clamp-1 mb-3">{a.description}</p>
                              <div className="flex items-center justify-between">
                                {a.artist && (
                                  <div className="flex items-center gap-1.5">
                                    <Avatar name={a.artist.fullName} avatar={a.artist.avatarUrl ?? undefined} size="xs" />
                                    <span className="text-xs text-text-muted font-body">{a.artist.fullName}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <PriorityBadge priority={normPriority(a.priority)} />
                                  <span className={cn("flex items-center gap-1 text-xs font-mono",
                                    isOverdue ? "text-red-400" : isUrgent ? "text-amber-400" : "text-text-muted")}>
                                    <Clock size={11} />
                                    {isOverdue ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right column */}
            <div className="space-y-6">
              {/* Pending Reviews */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-display font-bold text-text-primary tracking-wide">Pending Reviews</h2>
                  {(stats?.pendingSubmissions ?? 0) > 0 && (
                    <span className="badge-count">{stats?.pendingSubmissions}</span>
                  )}
                </div>
                {(stats?.pendingSubmissions ?? 0) === 0 ? (
                  <div className="card-premium rounded-xl p-6 text-center">
                    <CheckCircle size={24} className="text-neon mx-auto mb-2" />
                    <p className="text-sm text-text-muted font-body">All caught up!</p>
                  </div>
                ) : (
                  <Link href="/supervisor/submissions">
                    <div className="card-premium rounded-xl p-4 cursor-pointer hover:border-[rgba(139,92,246,0.3)] transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-violet-400/10 flex items-center justify-center">
                          <AlertCircle size={16} className="text-violet-400" />
                        </div>
                        <div>
                          <p className="text-sm font-display font-bold text-text-primary">
                            {stats?.pendingSubmissions} submission{(stats?.pendingSubmissions ?? 0) !== 1 ? "s" : ""} to review
                          </p>
                          <p className="text-xs text-text-muted font-body">Click to review</p>
                        </div>
                      </div>
                    </div>
                    <Button variant="neon-outline" size="sm" className="w-full mt-2">Review All</Button>
                  </Link>
                )}
              </div>

              {/* Recent Messages */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-display font-bold text-text-primary tracking-wide">Recent Chats</h2>
                  <Link href="/supervisor/chat" className="text-xs text-neon hover:text-neon-bright transition-colors font-display tracking-wider flex items-center gap-1">
                    All <ArrowRight size={12} />
                  </Link>
                </div>
                <div className="space-y-2">
                  {convos.length === 0 ? (
                    <div className="card-premium rounded-xl p-6 text-center">
                      <MessageSquare size={20} className="text-text-muted mx-auto mb-2" />
                      <p className="text-sm text-text-muted font-body">No conversations yet</p>
                    </div>
                  ) : convos.map((conv) => (
                    <Link key={conv.id} href={`/supervisor/chat/${conv.id}`}>
                      <div className="card-premium rounded-xl p-3 cursor-pointer hover:border-[rgba(0,232,122,0.2)] transition-all group">
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={conv.otherUser?.fullName ?? "?"}
                            avatar={conv.otherUser?.avatarUrl ?? undefined}
                            size="sm"
                            showStatus
                            status={conv.otherUser?.isOnline ? "online" : "offline"}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-semibold font-display text-text-primary group-hover:text-neon transition-colors">
                                {conv.otherUser?.fullName}
                              </p>
                              <span className="text-2xs text-text-muted font-mono">
                                {formatRelativeTime(conv.lastMessageAt)}
                              </span>
                            </div>
                          </div>
                          {conv.unreadCount > 0 && <span className="badge-count">{conv.unreadCount}</span>}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
