"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Clock, Briefcase } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatusBadge, PriorityBadge } from "@/components/ui/StatusBadge";
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
  createdBy: { id: string; fullName: string; avatarUrl: string | null } | null;
  _count: { submissions: number };
}

const STATUS_FILTERS = [
  { label: "All",      value: "" },
  { label: "Active",   value: "IN_PROGRESS" },
  { label: "Pending",  value: "PENDING" },
  { label: "Revision", value: "REVISION" },
  { label: "Approved", value: "APPROVED" },
];

function daysUntil(d: string) { return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000); }

export default function ArtistAssignmentsPage() {
  const [assignments, setAssignments] = useState<ApiAssignment[]>([]);
  const [search,      setSearch]      = useState("");
  const [status,      setStatus]      = useState("");
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    fetch(`/api/assignments?${params}`)
      .then((r) => r.json())
      .then((d) => setAssignments(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status]);

  const filtered = assignments.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout
      title="My Assignments"
      subtitle="All your creative work in one place"
      requiredRole="artist"
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
                  : "bg-white/3 text-text-muted border-[var(--border)] hover:text-text-primary"
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
      ) : filtered.length === 0 ? (
        <div className="card-premium rounded-2xl p-16 text-center">
          <Briefcase size={40} className="text-text-muted mx-auto mb-4" />
          <p className="text-text-primary font-display font-bold text-lg">No assignments found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a, i) => {
            const daysLeft  = daysUntil(a.deadlineUtc);
            const isOverdue = daysLeft < 0;
            const isUrgent  = daysLeft <= 3 && daysLeft >= 0;
            return (
              <Link key={a.id} href={`/artist/assignments/${a.id}`}>
                <div className="card-premium rounded-xl p-5 cursor-pointer hover:border-[rgba(0,232,122,0.2)] hover:shadow-card-hover transition-all group"
                  style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-sm font-display font-bold text-text-primary group-hover:text-neon transition-colors">{a.title}</h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <PriorityBadge priority={a.priority} />
                      <StatusBadge status={a.status} />
                    </div>
                  </div>
                  <p className="text-xs text-text-secondary font-body line-clamp-2 mb-3">{a.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {(a.tags ?? []).slice(0, 3).map((tag) => (
                        <span key={tag} className="text-2xs text-text-muted font-mono bg-white/4 px-1.5 py-0.5 rounded">#{tag}</span>
                      ))}
                    </div>
                    <span className={cn("text-xs font-mono flex items-center gap-1",
                      isOverdue ? "text-red-400" : isUrgent ? "text-amber-400" : "text-text-muted")}>
                      <Clock size={11} />
                      {isOverdue ? `${Math.abs(daysLeft)}d overdue` : `Due ${formatDate(a.deadlineUtc)}`}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
