"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, UserPlus, Search, Globe, Mail } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

interface ArtistUser {
  id: string;
  fullName: string;
  email: string;
  country: string | null;
  avatarUrl: string | null;
  specialty: string | null;
  isOnline: boolean;
  lastSeenAt: string | null;
  createdAt: string;
  _count: { assignmentsAssigned: number; submissions: number };
}

export default function AdminArtistsPage() {
  const [artists,  setArtists]  = useState<ArtistUser[]>([]);
  const [search,   setSearch]   = useState("");
  const [country,  setCountry]  = useState("");
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ role: "ARTIST" });
    if (search)  params.set("search", search);
    if (country) params.set("country", country);
    fetch(`/api/users?${params}`)
      .then((r) => r.json())
      .then((d) => setArtists(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, country]);

  return (
    <DashboardLayout
      title="Artists"
      subtitle={`${artists.length} active artists on the platform`}
      requiredRole="super_admin"
      headerActions={
        <Link href="/admin/artists/create">
          <Button size="sm" icon={<UserPlus size={14} />}>Add Artist</Button>
        </Link>
      }
    >
      <div className="mb-6 flex gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search artists..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search size={15} />}
          />
        </div>
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="px-3 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-text-primary text-sm font-body focus:outline-none focus:border-neon/40"
        >
          <option value="">All Countries</option>
          <option value="US">United States</option>
          <option value="MY">Malaysia</option>
          <option value="GB">United Kingdom</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-neon/20 border-t-neon animate-spin" />
        </div>
      ) : artists.length === 0 ? (
        <div className="card-premium rounded-2xl p-16 text-center">
          <Users size={40} className="text-text-muted mx-auto mb-4" />
          <p className="text-text-primary font-display font-bold text-lg">No artists found</p>
          <p className="text-text-muted font-body text-sm mt-2">
            {search ? "Try a different search term." : "Invite artists to the platform."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {artists.map((a) => (
            <div key={a.id} className="card-premium rounded-xl p-5 hover:border-blue-400/20 hover:shadow-card-hover transition-all">
              <div className="flex items-start gap-3 mb-4">
                <Avatar
                  name={a.fullName}
                  avatar={a.avatarUrl ?? undefined}
                  size="md"
                  showStatus
                  status={a.isOnline ? "online" : "offline"}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-display font-bold text-text-primary truncate">{a.fullName}</p>
                  {a.specialty && (
                    <p className="text-2xs text-blue-400 font-body mt-0.5">{a.specialty}</p>
                  )}
                  <div className="flex items-center gap-1 mt-0.5">
                    <Mail size={11} className="text-text-muted flex-shrink-0" />
                    <p className="text-2xs text-text-muted font-body truncate">{a.email}</p>
                  </div>
                  {a.country && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Globe size={11} className="text-text-muted flex-shrink-0" />
                      <p className="text-2xs text-text-muted font-body">{a.country}</p>
                    </div>
                  )}
                </div>
                <span className={cn(
                  "px-2 py-0.5 rounded-md text-2xs font-mono font-bold border",
                  a.isOnline
                    ? "text-neon bg-neon/8 border-neon/20"
                    : "text-text-muted bg-white/3 border-white/8"
                )}>
                  {a.isOnline ? "Online" : "Offline"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/3 rounded-lg px-3 py-2">
                  <p className="text-xs font-mono font-bold text-text-primary">{a._count.assignmentsAssigned}</p>
                  <p className="text-2xs text-text-muted font-body mt-0.5">Assignments</p>
                </div>
                <div className="bg-white/3 rounded-lg px-3 py-2">
                  <p className="text-xs font-mono font-bold text-text-primary">{a._count.submissions}</p>
                  <p className="text-2xs text-text-muted font-body mt-0.5">Submissions</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
