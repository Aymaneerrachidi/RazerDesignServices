"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { UserPlus, Search, MessageSquare, Briefcase, Mail, Trash2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getUserStatusColor } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Artist {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  specialty: string | null;
  bio: string | null;
  isOnline: boolean;
  country: string | null;
  _count: { assignmentsAssigned: number; submissions: number };
}

export default function ArtistsPage() {
  const [artists,    setArtists]    = useState<Artist[]>([]);
  const [search,     setSearch]     = useState("");
  const [loading,    setLoading]    = useState(true);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [deleting,   setDeleting]   = useState<string | null>(null);

  const removeArtist = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        setArtists((prev) => prev.filter((a) => a.id !== id));
      }
    } catch {}
    setDeleting(null);
    setConfirmDel(null);
  };

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    fetch(`/api/users?${params}`)
      .then((r) => r.json())
      .then((d) => setArtists(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <DashboardLayout
      title="Artists"
      subtitle="Manage your creative team"
      requiredRole="supervisor"
      headerActions={
        <Link href="/supervisor/artists/create">
          <Button size="sm" icon={<UserPlus size={14} />}>Add Artist</Button>
        </Link>
      }
    >
      <div className="mb-6">
        <Input
          placeholder="Search artists by name, email, or specialty..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search size={15} />}
          className="max-w-md"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-neon/20 border-t-neon animate-spin" />
        </div>
      ) : artists.length === 0 ? (
        <div className="card-premium rounded-2xl p-16 text-center">
          <UserPlus size={40} className="text-text-muted mx-auto mb-4" />
          <p className="text-text-primary font-display font-bold text-lg">No artists found</p>
          <p className="text-text-muted font-body text-sm mt-2">
            {search ? "Try a different search." : "Contact your admin to invite artists."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {artists.map((artist, i) => (
            <div
              key={artist.id}
              className="card-premium rounded-2xl overflow-hidden group hover:border-[rgba(0,232,122,0.2)] hover:shadow-card-hover transition-all duration-300"
              style={{ animation: `slideUp 0.4s cubic-bezier(0.16,1,0.3,1) ${i * 60}ms both` }}
            >
              <div className="h-16 bg-gradient-to-r from-neon/5 to-neon/0 border-b border-[var(--border)] relative overflow-hidden">
                <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(circle at 20% 50%, rgba(0,232,122,0.15), transparent 60%)" }} />
                <div className="absolute right-4 top-4 flex items-center gap-1.5">
                  <span className={cn("w-2 h-2 rounded-full", artist.isOnline ? "bg-neon" : "bg-gray-600")} />
                  <span className="text-2xs font-mono text-text-muted">{artist.isOnline ? "Online" : "Offline"}</span>
                </div>
              </div>

              <div className="px-5 pb-5">
                <div className="-mt-8 mb-3">
                  <Avatar
                    name={artist.fullName}
                    avatar={artist.avatarUrl ?? undefined}
                    size="xl"
                    status={artist.isOnline ? "online" : "offline"}
                    showStatus
                    className="ring-4 ring-void"
                  />
                </div>

                <h3 className="text-base font-display font-bold text-text-primary group-hover:text-neon transition-colors">
                  {artist.fullName}
                </h3>
                {artist.specialty && <p className="text-xs text-neon/80 font-body mb-1">{artist.specialty}</p>}
                <p className="text-xs text-text-muted font-mono flex items-center gap-1 mb-4">
                  <Mail size={11} /> {artist.email}
                </p>

                <div className="grid grid-cols-2 gap-2 mb-5">
                  <div className="bg-white/3 rounded-lg p-2 text-center border border-[var(--border)]">
                    <p className="text-lg font-display font-bold text-amber-400">{artist._count.assignmentsAssigned}</p>
                    <p className="text-2xs text-text-muted font-body">Assignments</p>
                  </div>
                  <div className="bg-white/3 rounded-lg p-2 text-center border border-[var(--border)]">
                    <p className="text-lg font-display font-bold text-neon">{artist._count.submissions}</p>
                    <p className="text-2xs text-text-muted font-body">Submissions</p>
                  </div>
                </div>

                {artist.bio && (
                  <p className="text-xs text-text-secondary font-body line-clamp-2 mb-4">{artist.bio}</p>
                )}

                <div className="flex gap-2">
                  <Link href={`/supervisor/chat`} className="flex-1">
                    <Button variant="neon-outline" size="sm" className="w-full" icon={<MessageSquare size={13} />}>
                      Message
                    </Button>
                  </Link>
                  <Link href={`/supervisor/assignments/create?artistId=${artist.id}`} className="flex-1">
                    <Button variant="ghost" size="sm" className="w-full" icon={<Briefcase size={13} />}>
                      Assign
                    </Button>
                  </Link>
                </div>

                {/* Delete / confirm row */}
                <div className="mt-2">
                  {confirmDel === artist.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => removeArtist(artist.id)}
                        disabled={deleting === artist.id}
                        className="flex-1 text-2xs font-mono text-red-400 border border-red-500/30 rounded-lg py-1.5 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                      >
                        {deleting === artist.id ? "Removing…" : "Confirm remove"}
                      </button>
                      <button
                        onClick={() => setConfirmDel(null)}
                        className="flex-1 text-2xs font-mono text-text-muted border border-[var(--border)] rounded-lg py-1.5 hover:bg-white/5 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDel(artist.id)}
                      className="w-full flex items-center justify-center gap-1.5 text-2xs font-mono text-text-muted hover:text-red-400 transition-colors py-1.5"
                    >
                      <Trash2 size={11} /> Remove artist
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
