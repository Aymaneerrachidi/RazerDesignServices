"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Clock, Briefcase } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatusBadge, PriorityBadge } from "@/components/ui/StatusBadge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface ApiAssignment {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  deadlineUtc: string;
  tags: string[];
  artist: { id: string; fullName: string; avatarUrl: string | null } | null;
  _count: { submissions: number };
}

const STATUS_FILTERS = [
  { label: "All", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Submitted", value: "SUBMITTED" },
  { label: "Approved", value: "APPROVED" },
  { label: "Revision", value: "REVISION" },
];

function daysUntil(d: string) { return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000); }

export default function SupervisorAssignmentsPage() {
  const [assignments, setAssignments] = useState<ApiAssignment[]>([]);
  const [search,      setSearch]      = useState("");
  const [status,      setStatus]      = useState("");
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    fetch(`/api/assignments?${params}`)
      .then((r) => r.json())
      .then((d) => setAssignments(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, status]);

  return (
    <DashboardLayout
      title="Assignments"
      subtitle="Manage and track all creative briefs"
      requiredRole="supervisor"
      headerActions={
        <Link href="/supervisor/assignments/create">
          <Button size="sm" icon={<Plus size={14} />}>New Assignment</Button>
        </Link>
      }
    >
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Input
          placeholder="Search assignments..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search size={15} />}
          className="sm:max-w-xs"
        />
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button key={f.value} onClick={() => setStatus(f.value)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-display font-semibold tracking-wide transition-all duration-200 border",
                status === f.value
                  ? "bg-neon/10 text-neon border-neon/25"
                  : "bg-white/3 text-text-muted border-[var(--border)] hover:text-text-primary hover:border-white/10"
              )}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-neon/20 border-t-neon animate-spin" />
        </div>
      ) : (
        <>
          <p className="text-xs text-text-muted font-mono mb-4">
            {assignments.length} assignment{assignments.length !== 1 ? "s" : ""} found
          </p>

          <div className="card-premium rounded-2xl overflow-hidden">
            <div className="neon-line" />
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3 border-b border-[var(--border)]">
              {["Assignment", "Artist", "Priority", "Status", "Due"].map((h) => (
                <span key={h} className="text-2xs font-bold text-text-muted font-display tracking-[0.15em] uppercase">{h}</span>
              ))}
            </div>

            {assignments.length === 0 ? (
              <div className="text-center py-16">
                <Briefcase size={32} className="text-text-muted mx-auto mb-3" />
                <p className="text-text-muted font-body">No assignments match your filters</p>
              </div>
            ) : (
              assignments.map((a, i) => {
                const daysLeft  = daysUntil(a.deadlineUtc);
                const isOverdue = daysLeft < 0;
                const isUrgent  = daysLeft <= 2 && daysLeft >= 0;
                return (
                  <Link key={a.id} href={`/supervisor/assignments/${a.id}`}>
                    <div className={cn(
                      "grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center px-5 py-4 cursor-pointer group hover:bg-white/2 transition-colors",
                      i < assignments.length - 1 && "border-b border-[var(--border)]"
                    )}>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold font-display text-text-primary group-hover:text-neon transition-colors truncate">{a.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {(a.tags ?? []).slice(0, 2).map((tag) => (
                            <span key={tag} className="text-2xs text-text-muted font-mono bg-white/4 px-1.5 py-0.5 rounded">#{tag}</span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {a.artist ? (
                          <>
                            <Avatar name={a.artist.fullName} avatar={a.artist.avatarUrl ?? undefined} size="xs" />
                            <span className="text-xs text-text-secondary font-body hidden sm:block">
                              {a.artist.fullName.split(" ")[0]}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-text-muted font-body">—</span>
                        )}
                      </div>

                      <PriorityBadge priority={a.priority} />
                      <StatusBadge status={a.status} />

                      <span className={cn("text-xs font-mono whitespace-nowrap flex items-center gap-1",
                        isOverdue ? "text-red-400" : isUrgent ? "text-amber-400" : "text-text-muted")}>
                        <Clock size={11} />
                        {isOverdue ? `${Math.abs(daysLeft)}d overdue` : formatDate(a.deadlineUtc)}
                      </span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
