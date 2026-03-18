"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Briefcase, Search, Clock } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge, PriorityBadge } from "@/components/ui/StatusBadge";
import { Input } from "@/components/ui/Input";
import { formatDate } from "@/lib/utils";

interface ApiAssignment {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  deadlineUtc: string;
  createdAt: string;
  artist: { id: string; fullName: string; avatarUrl: string | null } | null;
  createdBy: { id: string; fullName: string } | null;
  region: { name: string; code: string } | null;
  _count: { submissions: number };
}

const STATUS_OPTIONS = ["", "PENDING", "IN_PROGRESS", "SUBMITTED", "APPROVED", "REVISION"];

export default function AdminAssignmentsPage() {
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

  // Map backend statuses to frontend display format
  const normalizeStatus = (s: string) =>
    s.toLowerCase().replace("_", "-") as any;

  return (
    <DashboardLayout
      title="All Assignments"
      subtitle={`${assignments.length} total assignments`}
      requiredRole="super_admin"
    >
      <div className="mb-6 flex gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search assignments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search size={15} />}
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-text-primary text-sm font-body focus:outline-none focus:border-neon/40"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s || "All Statuses"}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-neon/20 border-t-neon animate-spin" />
        </div>
      ) : assignments.length === 0 ? (
        <div className="card-premium rounded-2xl p-16 text-center">
          <Briefcase size={40} className="text-text-muted mx-auto mb-4" />
          <p className="text-text-primary font-display font-bold text-lg">No assignments found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => (
            <div key={a.id} className="card-premium rounded-xl p-4 hover:border-neon/20 transition-all">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1.5">
                    <h3 className="text-sm font-display font-bold text-text-primary truncate">{a.title}</h3>
                    <StatusBadge status={normalizeStatus(a.status)} />
                    <PriorityBadge priority={a.priority.toLowerCase() as any} />
                  </div>
                  <p className="text-xs text-text-secondary font-body line-clamp-1 mb-2">{a.description}</p>
                  <div className="flex items-center gap-4 flex-wrap">
                    {a.artist && (
                      <div className="flex items-center gap-1.5">
                        <Avatar name={a.artist.fullName} avatar={a.artist.avatarUrl ?? undefined} size="xs" />
                        <span className="text-xs text-text-muted font-body">{a.artist.fullName}</span>
                      </div>
                    )}
                    {a.createdBy && (
                      <span className="text-xs text-text-muted font-body">
                        by {a.createdBy.fullName}
                      </span>
                    )}
                    {a.region && (
                      <span className="text-xs text-text-muted font-mono bg-white/5 px-2 py-0.5 rounded">
                        {a.region.code}
                      </span>
                    )}
                    <div className="flex items-center gap-1 text-xs text-text-muted font-mono ml-auto">
                      <Clock size={11} />
                      {formatDate(a.deadlineUtc)}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-text-muted font-mono flex-shrink-0">
                  {a._count.submissions} sub{a._count.submissions !== 1 ? "s" : ""}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
