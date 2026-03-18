"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, UserPlus, Search, Globe, Mail, Briefcase } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

interface SupervisorUser {
  id: string;
  fullName: string;
  email: string;
  country: string | null;
  avatarUrl: string | null;
  specialty: string | null;
  isOnline: boolean;
  createdAt: string;
  _count: { assignmentsAssigned: number; submissions: number };
}

export default function AdminSupervisorsPage() {
  const [supervisors, setSupervisors] = useState<SupervisorUser[]>([]);
  const [search,      setSearch]      = useState("");
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/users?role=SUPERVISOR${search ? `&search=${encodeURIComponent(search)}` : ""}`)
      .then((r) => r.json())
      .then((d) => setSupervisors(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <DashboardLayout
      title="Supervisors"
      subtitle="Manage supervisor accounts"
      requiredRole="super_admin"
      headerActions={
        <Link href="/admin/invites">
          <Button size="sm" icon={<UserPlus size={14} />}>Invite Supervisor</Button>
        </Link>
      }
    >
      <div className="mb-6 flex gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search supervisors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search size={15} />}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-neon/20 border-t-neon animate-spin" />
        </div>
      ) : supervisors.length === 0 ? (
        <div className="card-premium rounded-2xl p-16 text-center">
          <Users size={40} className="text-text-muted mx-auto mb-4" />
          <p className="text-text-primary font-display font-bold text-lg">No supervisors found</p>
          <p className="text-text-muted font-body text-sm mt-2">
            {search ? "Try a different search term." : "Invite a supervisor to get started."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {supervisors.map((s) => (
            <div key={s.id} className="card-premium rounded-xl p-5 hover:border-neon/20 hover:shadow-card-hover transition-all">
              <div className="flex items-start gap-3 mb-4">
                <Avatar
                  name={s.fullName}
                  avatar={s.avatarUrl ?? undefined}
                  size="md"
                  showStatus
                  status={s.isOnline ? "online" : "offline"}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-display font-bold text-text-primary truncate">{s.fullName}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Mail size={11} className="text-text-muted flex-shrink-0" />
                    <p className="text-2xs text-text-muted font-body truncate">{s.email}</p>
                  </div>
                  {s.country && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Globe size={11} className="text-text-muted flex-shrink-0" />
                      <p className="text-2xs text-text-muted font-body">{s.country}</p>
                    </div>
                  )}
                </div>
                <span className={cn(
                  "px-2 py-0.5 rounded-md text-2xs font-mono font-bold border",
                  s.isOnline
                    ? "text-neon bg-neon/8 border-neon/20"
                    : "text-text-muted bg-white/3 border-white/8"
                )}>
                  {s.isOnline ? "Online" : "Offline"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/3 rounded-lg px-3 py-2">
                  <p className="text-xs font-mono font-bold text-text-primary">{s._count.assignmentsAssigned}</p>
                  <p className="text-2xs text-text-muted font-body mt-0.5">Assignments</p>
                </div>
                <div className="bg-white/3 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-1">
                    <Briefcase size={10} className="text-neon" />
                    <p className="text-xs font-mono font-bold text-text-primary">{s._count.submissions}</p>
                  </div>
                  <p className="text-2xs text-text-muted font-body mt-0.5">Reviews</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
