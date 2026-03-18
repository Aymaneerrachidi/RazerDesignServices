"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Calendar, Download, Tag, Clock, MessageSquare,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatusBadge, PriorityBadge } from "@/components/ui/StatusBadge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { formatDate, formatDateTime, getFileIcon, formatFileSize, getDaysUntilDue } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface AssignmentFile {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
}

interface Submission {
  id: string;
  versionNumber: number;
  status: string;
  note: string | null;
  feedback: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  files: AssignmentFile[];
  reviewedBy: { id: string; fullName: string; avatarUrl: string | null } | null;
}

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  referenceNotes: string | null;
  tags: string[];
  status: string;
  priority: string;
  deadlineUtc: string;
  createdAt: string;
  updatedAt: string;
  artist: { id: string; fullName: string; avatarUrl: string | null; specialty: string | null } | null;
  createdBy: { id: string; fullName: string; avatarUrl: string | null } | null;
  attachments: AssignmentFile[];
  submissions: Submission[];
}

const STATUS_OPTIONS = ["PENDING", "IN_PROGRESS", "SUBMITTED", "APPROVED", "REVISION", "REJECTED"] as const;

export default function AssignmentDetailPage() {
  const { id } = useParams() as { id: string };

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [notFound,   setNotFound]   = useState(false);
  const [updating,   setUpdating]   = useState(false);

  useEffect(() => {
    fetch(`/api/assignments/${id}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then((d) => { if (d?.data) setAssignment(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const updateStatus = async (status: string) => {
    if (!assignment || updating) return;
    setUpdating(true);
    try {
      const res  = await fetch(`/api/assignments/${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status }),
      });
      const data = await res.json();
      if (res.ok) setAssignment((prev) => prev ? { ...prev, status } : prev);
    } catch {}
    finally { setUpdating(false); }
  };

  if (loading) {
    return (
      <DashboardLayout title="Assignment" requiredRole="supervisor">
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-neon/20 border-t-neon animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (notFound || !assignment) {
    return (
      <DashboardLayout title="Assignment" requiredRole="supervisor">
        <div className="text-center py-20 text-text-muted font-body">Assignment not found.</div>
      </DashboardLayout>
    );
  }

  const daysLeft = getDaysUntilDue(assignment.deadlineUtc);

  return (
    <DashboardLayout
      title={assignment.title}
      subtitle={`Assignment #${assignment.id.slice(0, 8)}`}
      requiredRole="supervisor"
      headerActions={
        <div className="flex gap-2">
          <Link href="/supervisor/assignments">
            <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />}>Back</Button>
          </Link>
        </div>
      }
    >
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Header card */}
          <div className="card-premium rounded-2xl p-6 space-y-4">
            <div className="neon-line -mx-6 -mt-6 rounded-t-2xl" />
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <StatusBadge status={assignment.status} />
              <PriorityBadge priority={assignment.priority} />
              <span className={cn(
                "text-xs font-mono flex items-center gap-1",
                daysLeft < 0 ? "text-red-400" : daysLeft <= 3 ? "text-amber-400" : "text-text-muted"
              )}>
                <Clock size={12} />
                {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d remaining`}
              </span>
            </div>

            <h2 className="text-xl font-display font-bold text-text-primary">{assignment.title}</h2>

            {assignment.description && (
              <div>
                <p className="text-xs text-text-muted font-display tracking-widest uppercase mb-2">Description</p>
                <p className="text-sm text-text-secondary font-body leading-relaxed whitespace-pre-line">
                  {assignment.description}
                </p>
              </div>
            )}

            {assignment.referenceNotes && (
              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/15">
                <p className="text-xs font-display font-bold text-amber-400 tracking-widest uppercase mb-1.5">
                  Reference Notes
                </p>
                <p className="text-sm text-text-secondary font-body leading-relaxed">
                  {assignment.referenceNotes}
                </p>
              </div>
            )}

            {assignment.tags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <Tag size={13} className="text-text-muted" />
                {assignment.tags.map((t) => (
                  <span key={t} className="text-xs text-text-muted font-mono bg-white/4 px-2 py-0.5 rounded-md border border-[var(--border)]">
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Attachments */}
          {assignment.attachments.length > 0 && (
            <div className="card-premium rounded-2xl p-5">
              <h3 className="text-sm font-display font-bold text-text-primary mb-4">
                Attachments ({assignment.attachments.length})
              </h3>
              <div className="space-y-2">
                {assignment.attachments.map((att) => (
                  <a
                    key={att.id}
                    href={att.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/2 border border-[var(--border)] hover:border-neon/20 transition-all group"
                  >
                    <span className="text-xl">{getFileIcon(att.mimeType.split("/")[1] ?? "")}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-body text-text-primary truncate">{att.fileName}</p>
                      <p className="text-xs text-text-muted font-mono">{formatFileSize(att.fileSize)}</p>
                    </div>
                    <Download size={14} className="text-text-muted group-hover:text-neon transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Submissions */}
          <div className="card-premium rounded-2xl p-5">
            <h3 className="text-sm font-display font-bold text-text-primary mb-4">
              Submissions ({assignment.submissions.length})
            </h3>
            {assignment.submissions.length === 0 ? (
              <div className="text-center py-8 text-text-muted">
                <p className="text-sm font-body">No submissions yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignment.submissions.map((sub) => (
                  <div key={sub.id} className="p-4 rounded-xl bg-white/2 border border-[var(--border)]">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {assignment.artist && (
                          <Avatar
                            name={assignment.artist.fullName}
                            avatar={assignment.artist.avatarUrl ?? undefined}
                            size="sm"
                          />
                        )}
                        <div>
                          <p className="text-xs font-semibold font-display text-text-primary">
                            {assignment.artist?.fullName ?? "Artist"} · v{sub.versionNumber}
                          </p>
                          <p className="text-2xs text-text-muted font-mono">{formatDateTime(sub.submittedAt)}</p>
                        </div>
                      </div>
                      <StatusBadge status={sub.status} />
                    </div>

                    {sub.note && (
                      <p className="text-xs text-text-secondary font-body mb-3 italic">"{sub.note}"</p>
                    )}

                    {sub.files.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {sub.files.map((f) => (
                          <a
                            key={f.id}
                            href={f.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-text-muted font-mono bg-white/4 px-2.5 py-1 rounded-lg border border-[var(--border)] hover:border-neon/20 transition-colors"
                          >
                            {getFileIcon(f.mimeType.split("/")[1] ?? "")} {f.fileName}
                          </a>
                        ))}
                      </div>
                    )}

                    {sub.feedback && (
                      <div className="mt-2 p-3 rounded-lg bg-neon/4 border border-neon/12">
                        <p className="text-2xs text-neon font-display tracking-widest uppercase font-bold mb-1">Supervisor Feedback</p>
                        <p className="text-xs text-text-secondary font-body">{sub.feedback}</p>
                        {sub.reviewedAt && (
                          <p className="text-2xs text-text-muted font-mono mt-1">Reviewed {formatDateTime(sub.reviewedAt)}</p>
                        )}
                      </div>
                    )}

                    <Link href="/supervisor/submissions">
                      <Button variant="ghost" size="sm" className="mt-3 w-full">Full Review</Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Metadata */}
          <div className="card-premium rounded-2xl p-5 space-y-4">
            <div className="neon-line -mx-5 -mt-5 rounded-t-2xl" />
            <h3 className="text-sm font-display font-bold text-text-primary pt-1">Details</h3>

            {[
              { label: "Created",  value: formatDate(assignment.createdAt),   icon: <Calendar size={13} /> },
              { label: "Updated",  value: formatDate(assignment.updatedAt),   icon: <Clock    size={13} /> },
              {
                label: "Due Date", value: formatDate(assignment.deadlineUtc), icon: <Calendar size={13} />,
                highlight: daysLeft < 0 ? "text-red-400" : daysLeft <= 3 ? "text-amber-400" : undefined,
              },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3">
                <span className="text-text-muted mt-0.5">{item.icon}</span>
                <div>
                  <p className="text-2xs text-text-muted font-display tracking-widest uppercase">{item.label}</p>
                  <p className={cn("text-xs font-mono text-text-secondary mt-0.5", item.highlight)}>
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Assigned artist */}
          {assignment.artist && (
            <div className="card-premium rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-display font-bold text-text-primary">Assigned To</h3>
              <div className="flex items-center gap-3">
                <Avatar
                  name={assignment.artist.fullName}
                  avatar={assignment.artist.avatarUrl ?? undefined}
                  size="sm"
                  showStatus
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold font-display text-text-primary">{assignment.artist.fullName}</p>
                  {assignment.artist.specialty && (
                    <p className="text-2xs text-text-muted font-body">{assignment.artist.specialty}</p>
                  )}
                </div>
                <Link href="/supervisor/chat">
                  <button className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-neon hover:bg-neon/8 transition-all">
                    <MessageSquare size={13} />
                  </button>
                </Link>
              </div>
            </div>
          )}

          {/* Status update */}
          <div className="card-premium rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-display font-bold text-text-primary">Update Status</h3>
            {STATUS_OPTIONS.map((s) => {
              const isCurrent = assignment.status.toUpperCase() === s;
              return (
                <button
                  key={s}
                  onClick={() => !isCurrent && updateStatus(s)}
                  disabled={updating}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg border text-xs font-display tracking-wide transition-all",
                    isCurrent
                      ? "border-neon/30 bg-neon/5 text-neon"
                      : "border-[var(--border)] text-text-muted hover:border-white/10 hover:text-text-primary"
                  )}
                >
                  {isCurrent && "● "}
                  {s.charAt(0) + s.slice(1).toLowerCase().replace("_", " ")}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
