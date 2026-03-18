"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, RotateCcw, Download, Eye } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Input";
import { formatDateTime, formatFileSize, getFileIcon } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface SubmissionFile {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
}

interface ApiSubmission {
  id: string;
  versionNumber: number;
  note: string | null;
  status: string;
  feedback: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  files: SubmissionFile[];
  artist: { id: string; fullName: string; avatarUrl: string | null; specialty: string | null } | null;
  assignment: { id: string; title: string; priority: string } | null;
}

const STATUS_FILTERS = [
  { label: "All",            value: "" },
  { label: "Pending Review", value: "PENDING" },
  { label: "Approved",       value: "APPROVED" },
  { label: "Revision",       value: "REVISION" },
  { label: "Rejected",       value: "REJECTED" },
];

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<ApiSubmission[]>([]);
  const [filter,      setFilter]      = useState("");
  const [selected,    setSelected]    = useState<ApiSubmission | null>(null);
  const [feedback,    setFeedback]    = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [loading,     setLoading]     = useState(true);

  const fetchSubs = () => {
    setLoading(true);
    const params = filter ? `?status=${filter}` : "";
    fetch(`/api/submissions${params}`)
      .then((r) => r.json())
      .then((d) => setSubmissions(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSubs(); }, [filter]);

  const handleAction = async (subId: string, action: "APPROVED" | "REVISION" | "REJECTED") => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/submissions/${subId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action, feedback: feedback || undefined }),
      });
      if (res.ok) {
        setSubmissions((prev) =>
          prev.map((s) => s.id === subId ? { ...s, status: action, feedback } : s)
        );
        setSelected(null);
        setFeedback("");
      }
    } catch {
      // fail silently
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = submissions.filter((s) => s.status === "PENDING").length;

  return (
    <DashboardLayout
      title="Submissions"
      subtitle="Review and provide feedback on submitted artwork"
      requiredRole="supervisor"
    >
      <div className="flex gap-2 flex-wrap mb-6">
        {STATUS_FILTERS.map((f) => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={cn("px-3 py-1.5 rounded-lg text-xs font-display font-semibold tracking-wide transition-all border",
              filter === f.value
                ? "bg-neon/10 text-neon border-neon/25"
                : "bg-white/3 text-text-muted border-[var(--border)] hover:text-text-primary"
            )}>
            {f.label}
            {f.value === "PENDING" && pendingCount > 0 && (
              <span className="ml-1.5 badge-count inline-flex">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-neon/20 border-t-neon animate-spin" />
        </div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-20">
          <CheckCircle size={40} className="text-neon mx-auto mb-4" />
          <p className="text-text-primary font-display font-bold text-lg">All clear!</p>
          <p className="text-text-muted font-body mt-1">No submissions in this category</p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((sub, i) => (
            <div key={sub.id}
              className="card-premium rounded-2xl overflow-hidden group hover:border-[rgba(0,232,122,0.15)] transition-all duration-300"
              style={{ animation: `slideUp 0.4s cubic-bezier(0.16,1,0.3,1) ${i * 60}ms both` }}>
              <div className="p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    {sub.artist && (
                      <Avatar
                        name={sub.artist.fullName}
                        avatar={sub.artist.avatarUrl ?? undefined}
                        size="md"
                        status="offline"
                        showStatus
                      />
                    )}
                    <div>
                      <p className="text-sm font-display font-bold text-text-primary">{sub.artist?.fullName}</p>
                      <p className="text-xs text-text-muted font-mono">{formatDateTime(sub.submittedAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xs text-text-muted font-mono">v{sub.versionNumber}</span>
                    <StatusBadge status={sub.status} />
                  </div>
                </div>

                {sub.assignment && (
                  <div className="mb-4 p-3 rounded-xl bg-white/2 border border-[var(--border)]">
                    <p className="text-2xs text-text-muted font-display tracking-widest uppercase mb-1">Assignment</p>
                    <p className="text-sm font-semibold font-display text-text-primary">{sub.assignment.title}</p>
                  </div>
                )}

                {sub.note && (
                  <div className="mb-4">
                    <p className="text-xs text-text-muted font-display tracking-widest uppercase mb-1">Artist Note</p>
                    <p className="text-sm text-text-secondary font-body italic">"{sub.note}"</p>
                  </div>
                )}

                <div className="mb-4">
                  <p className="text-xs text-text-muted font-display tracking-widest uppercase mb-2">
                    Submitted Files ({sub.files.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {sub.files.map((f) => (
                      <a key={f.id} href={f.fileUrl} target="_blank" rel="noreferrer"
                        className="flex items-center gap-2 px-3 py-2 bg-white/3 border border-[var(--border)] rounded-xl hover:border-neon/20 transition-colors group/file cursor-pointer">
                        <span>{getFileIcon(f.mimeType.split("/")[1] ?? "")}</span>
                        <div>
                          <p className="text-xs font-body text-text-primary">{f.fileName}</p>
                          <p className="text-2xs text-text-muted font-mono">{formatFileSize(f.fileSize)}</p>
                        </div>
                        <Download size={13} className="text-text-muted group-hover/file:text-neon transition-colors ml-1" />
                      </a>
                    ))}
                  </div>
                </div>

                {sub.feedback && (
                  <div className="mb-4 p-3 rounded-xl bg-neon/4 border border-neon/12">
                    <p className="text-2xs text-neon font-display tracking-widest uppercase font-bold mb-1">Feedback</p>
                    <p className="text-xs text-text-secondary font-body">{sub.feedback}</p>
                  </div>
                )}

                {sub.status === "PENDING" && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--border)]">
                    <Button size="sm" onClick={() => { setSelected(sub); setFeedback(""); }}
                      icon={<Eye size={13} />} variant="neon-outline">
                      Review & Decide
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleAction(sub.id, "APPROVED")}
                      icon={<CheckCircle size={13} />}>
                      Quick Approve
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      <Modal isOpen={!!selected} onClose={() => { setSelected(null); setFeedback(""); }} title="Review Submission" size="lg">
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              {selected.artist && (
                <Avatar name={selected.artist.fullName} avatar={selected.artist.avatarUrl ?? undefined} size="md" />
              )}
              <div>
                <p className="font-display font-bold text-text-primary">{selected.artist?.fullName}</p>
                <p className="text-xs text-text-muted font-mono">{formatDateTime(selected.submittedAt)}</p>
              </div>
            </div>

            {selected.assignment && (
              <div className="p-3 rounded-xl bg-white/3 border border-[var(--border)]">
                <p className="text-2xs text-text-muted font-display tracking-widest uppercase mb-1">Assignment</p>
                <p className="text-sm font-display font-bold text-text-primary">{selected.assignment.title}</p>
              </div>
            )}

            {selected.note && (
              <div>
                <p className="text-xs text-text-muted font-display tracking-widest uppercase mb-1">Artist Note</p>
                <p className="text-sm text-text-secondary font-body italic">"{selected.note}"</p>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {selected.files.map((f) => (
                <a key={f.id} href={f.fileUrl} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-white/3 border border-[var(--border)] rounded-xl">
                  <span>{getFileIcon(f.mimeType.split("/")[1] ?? "")}</span>
                  <p className="text-xs font-body text-text-primary">{f.fileName}</p>
                </a>
              ))}
            </div>

            <Textarea
              label="Feedback (Optional)"
              placeholder="Provide detailed feedback for the artist..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
            />

            <div className="grid grid-cols-3 gap-3">
              <Button onClick={() => handleAction(selected.id, "APPROVED")} loading={submitting}
                icon={<CheckCircle size={14} />} className="bg-neon text-black">
                Approve
              </Button>
              <Button onClick={() => handleAction(selected.id, "REVISION")} loading={submitting}
                variant="ghost" icon={<RotateCcw size={14} />}
                className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
                Revision
              </Button>
              <Button onClick={() => handleAction(selected.id, "REJECTED")} loading={submitting}
                variant="danger" icon={<XCircle size={14} />}>
                Reject
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
