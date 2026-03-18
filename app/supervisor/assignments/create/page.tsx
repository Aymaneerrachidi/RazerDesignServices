"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Calendar, Tag, X, CheckCircle } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

interface Artist {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  specialty: string | null;
  isOnline: boolean;
}

export default function CreateAssignmentPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const preselected  = searchParams.get("artistId") ?? "";

  const [artists,       setArtists]       = useState<Artist[]>([]);
  const [title,         setTitle]         = useState("");
  const [description,   setDescription]   = useState("");
  const [referenceNotes,setReferenceNotes]= useState("");
  const [selectedArtist,setSelectedArtist]= useState(preselected);
  const [dueDate,       setDueDate]       = useState("");
  const [priority,      setPriority]      = useState("MEDIUM");
  const [tags,          setTags]          = useState<string[]>([]);
  const [tagInput,      setTagInput]      = useState("");
  const [loading,       setLoading]       = useState(false);
  const [success,       setSuccess]       = useState(false);
  const [error,         setError]         = useState("");

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((d) => setArtists(d.data ?? []))
      .catch(() => {});
  }, []);

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!title || !selectedArtist || !dueDate) {
      setError("Title, artist, and due date are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          referenceNotes,
          artistId: selectedArtist,
          deadlineUtc: new Date(dueDate).toISOString(),
          priority,
          tags,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create assignment.");
      } else {
        setSuccess(true);
        setTimeout(() => router.push("/supervisor/assignments"), 1500);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout
      title="Create Assignment"
      subtitle="Write a new brief for your artists"
      requiredRole="supervisor"
      headerActions={
        <Link href="/supervisor/assignments">
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />}>Back</Button>
        </Link>
      }
    >
      {success ? (
        <div className="max-w-xl mx-auto text-center py-20">
          <div className="w-20 h-20 rounded-full bg-neon/10 border border-neon/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={36} className="text-neon" />
          </div>
          <h2 className="text-2xl font-display font-bold text-text-primary mb-2">Assignment Created!</h2>
          <p className="text-text-secondary font-body">Artist will be notified. Redirecting...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main form */}
            <div className="lg:col-span-2 space-y-5">
              <div className="card-premium rounded-2xl p-6 space-y-5">
                <div className="neon-line -mx-6 -mt-6 rounded-t-2xl" />
                <h3 className="text-base font-display font-bold text-text-primary pt-2">Brief Details</h3>

                <Input
                  label="Assignment Title"
                  placeholder="e.g. Hero Banner — Q2 Campaign"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />

                <Textarea
                  label="Description"
                  placeholder="Describe the project in detail..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  required
                />

                <Textarea
                  label="Reference Notes"
                  placeholder="Style references, mood boards, specific direction..."
                  value={referenceNotes}
                  onChange={(e) => setReferenceNotes(e.target.value)}
                  rows={3}
                />

                {/* Tags */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-text-secondary font-display tracking-widest uppercase">Tags</label>
                  <div className="flex gap-2 flex-wrap mb-2">
                    {tags.map((t) => (
                      <span key={t} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-neon/8 text-neon text-xs rounded-lg border border-neon/15 font-mono">
                        #{t}
                        <button type="button" onClick={() => setTags((prev) => prev.filter((x) => x !== t))} className="hover:text-red-400">
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input type="text" value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                      placeholder="Add tag..."
                      className="input-base flex-1 rounded-lg h-9 text-sm font-mono px-3"
                    />
                    <Button type="button" variant="ghost" size="sm" onClick={addTag} icon={<Tag size={13} />}>Add</Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              <div className="card-premium rounded-2xl p-5 space-y-4">
                <div className="neon-line -mx-5 -mt-5 rounded-t-2xl" />
                <h3 className="text-sm font-display font-bold text-text-primary pt-1">Settings</h3>

                <Select
                  label="Priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  options={[
                    { value: "LOW",    label: "Low" },
                    { value: "MEDIUM", label: "Medium" },
                    { value: "HIGH",   label: "High" },
                    { value: "URGENT", label: "⚡ Urgent" },
                  ]}
                />

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-text-secondary font-display tracking-widest uppercase">Due Date</label>
                  <div className="relative">
                    <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required
                      className="input-base w-full rounded-lg h-11 text-sm font-mono pl-10 pr-4 cursor-pointer" />
                  </div>
                </div>
              </div>

              {/* Artist selector */}
              <div className="card-premium rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-display font-bold text-text-primary">Assign To</h3>
                {artists.length === 0 ? (
                  <p className="text-xs text-text-muted font-body">Loading artists...</p>
                ) : (
                  <div className="space-y-2">
                    {artists.map((artist) => {
                      const isSelected = selectedArtist === artist.id;
                      return (
                        <button key={artist.id} type="button" onClick={() => setSelectedArtist(artist.id)}
                          className={cn("w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 text-left",
                            isSelected ? "border-neon/30 bg-neon/5" : "border-[var(--border)] hover:border-white/10 hover:bg-white/2"
                          )}>
                          <Avatar name={artist.fullName} avatar={artist.avatarUrl ?? undefined} size="sm"
                            status={artist.isOnline ? "online" : "offline"} showStatus />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold font-display text-text-primary">{artist.fullName}</p>
                            {artist.specialty && <p className="text-2xs text-text-muted font-body">{artist.specialty}</p>}
                          </div>
                          <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all",
                            isSelected ? "border-neon bg-neon" : "border-text-muted")}>
                            {isSelected && <span className="text-black text-xs font-bold">✓</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {error && (
                <div className="px-4 py-3 rounded-lg bg-red-500/8 border border-red-500/20 text-red-400 text-sm font-body">{error}</div>
              )}

              <Button type="submit" size="lg" loading={loading} className="w-full"
                disabled={!title || !selectedArtist || !dueDate}>
                Create Assignment
              </Button>
            </div>
          </div>
        </form>
      )}
    </DashboardLayout>
  );
}
