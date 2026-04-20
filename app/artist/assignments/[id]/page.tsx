"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, Download, Paperclip, Tag, Upload } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatusBadge, PriorityBadge } from "@/components/ui/StatusBadge";
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
  attachments: AssignmentFile[];
  submissions: Submission[];
}

export default function ArtistAssignmentDetail() {
  const { id } = useParams() as { id: string };

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [notFound,   setNotFound]   = useState(false);

  useEffect(() => {
    fetch(`/api/assignments/${id}`)
      .then((r) => {
        if (r.status === 404 || r.status === 403) { setNotFound(true); return null; }
        return r.json();
      })
      .then((d) => { if (d?.data) setAssignment(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout title="Assignment" requiredRole="artist">
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-neon/20 border-t-neon animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (notFound || !assignment) {
    return (
      <DashboardLayout title="Assignment" requiredRole="artist">
        <div className="text-center py-20 text-text-muted font-body">Assignment not found or access denied.</div>
      </DashboardLayout>
    );
  }

  const daysLeft  = getDaysUntilDue(assignment.deadlineUtc);
  const isOverdue = daysLeft < 0;
  const isActive  = ["PENDING", "IN_PROGRESS", "REVISION"].includes((assignment.status ?? "").toUpperCase());

  return (
    <DashboardLayout
      title={assignment.title}
      subtitle={`Due ${formatDate(assignment.deadlineUtc)}`}
      requiredRole="artist"
      headerActions={
        <div className="flex gap-2">
          <Link href="/artist/assignments">
            <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />}>Back</Button>
          </Link>
          {isActive && (
            <Link href={`/artist/submit?assignmentId=${assignment.id}`}>
              <Button size="sm" icon={<Upload size={14} />}>Submit Work</Button>
            </Link>
          )}
        </div>
      }
    >
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Header */}
        <div className="card-premium rounded-2xl p-6 space-y-4">
          <div className="neon-line -mx-6 -mt-6 rounded-t-2xl" />
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <StatusBadge status={assignment.status} />
            <PriorityBadge priority={assignment.priority} />
            <span className={cn(
              "text-xs font-mono flex items-center gap-1",
              isOverdue ? "text-red-400" : daysLeft <= 3 ? "text-amber-400" : "text-text-muted"
            )}>
              <Clock size={12} />
              {isOverdue ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft} days remaining`}
            </span>
          </div>

          <h2 className="text-2xl font-display font-bold text-text-primary">{assignment.title}</h2>

          {assignment.description && (
            <div>
              <p className="text-xs text-text-muted font-display tracking-widest uppercase mb-2">Brief</p>
              <p className="text-sm text-text-secondary font-body leading-relaxed whitespace-pre-line">
                {assignment.description}
              </p>
            </div>
          )}

          {assignment.referenceNotes && (
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/15">
              <p className="text-xs font-display font-bold text-amber-400 tracking-widest uppercase mb-1.5">
                Reference Notes from Supervisor
              </p>
              <p className="text-sm text-text-secondary font-body leading-relaxed">
                {assignment.referenceNotes}
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-[var(--border)]">
            <div className="flex items-center gap-2 text-xs text-text-muted font-mono">
              <Calendar size={13} />
              Due: <span className={cn("font-semibold", isOverdue ? "text-red-400" : "text-text-primary")}>
                {formatDate(assignment.deadlineUtc)}
              </span>
            </div>
            {assignment.tags.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Tag size={11} className="text-text-muted" />
                {assignment.tags.map((t) => (
                  <span key={t} className="text-xs text-text-muted font-mono bg-white/4 px-1.5 py-0.5 rounded">
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Reference Files */}
        {assignment.attachments.length > 0 && (
          <div className="card-premium rounded-2xl p-5">
            <h3 className="text-sm font-display font-bold text-text-primary mb-4 flex items-center gap-2">
              <Paperclip size={15} className="text-text-muted" />
              Reference Files ({assignment.attachments.length})
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
                  <Download size={14} className="text-text-muted group-hover:text-neon transition-colors opacity-0 group-hover:opacity-100" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* My Submissions */}
        <div className="card-premium rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-display font-bold text-text-primary">
              My Submissions ({assignment.submissions.length})
            </h3>
            {isActive && (
              <Link href={`/artist/submit?assignmentId=${assignment.id}`}>
                <Button size="sm" icon={<Upload size={13} />}>
                  {assignment.submissions.length > 0 ? "Resubmit" : "Submit Work"}
                </Button>
              </Link>
            )}
          </div>

          {assignment.submissions.length === 0 ? (
            <div className="text-center py-10">
              <Upload size={28} className="text-text-muted mx-auto mb-2" />
              <p className="text-sm text-text-muted font-body">No submissions yet</p>
              <p className="text-xs text-text-muted font-body mt-1">
                When you&apos;re ready, upload your completed work.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignment.submissions.map((sub) => (
                <div key={sub.id} className="p-4 rounded-xl bg-white/2 border border-[var(--border)]">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-text-muted font-mono">
                      v{sub.versionNumber} · Submitted {formatDateTime(sub.submittedAt)}
                    </p>
                    <StatusBadge status={sub.status} />
                  </div>

                  {sub.note && (
                    <p className="text-xs text-text-secondary font-body italic mb-3">"{sub.note}"</p>
                  )}

                  {sub.files.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {sub.files.map((f) => (
                        <a
                          key={f.id}
                          href={f.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-text-muted font-mono bg-white/4 px-2 py-1 rounded-lg border border-[var(--border)] hover:border-neon/20 transition-colors"
                        >
                          {getFileIcon(f.mimeType.split("/")[1] ?? "")} {f.fileName}
                        </a>
                      ))}
                    </div>
                  )}

                  {sub.feedback && (
                    <div className={cn(
                      "p-3 rounded-lg border",
                      sub.status === "REVISION"
                        ? "bg-amber-500/5 border-amber-500/20"
                        : sub.status === "REJECTED"
                        ? "bg-red-500/5 border-red-500/20"
                        : "bg-neon/4 border-neon/12"
                    )}>
                      <p className={cn(
                        "text-2xs font-display tracking-widest uppercase font-bold mb-1",
                        sub.status === "REVISION" ? "text-amber-400" : sub.status === "REJECTED" ? "text-red-400" : "text-neon"
                      )}>
                        {sub.status === "REVISION" ? "Revision Notes" : sub.status === "REJECTED" ? "Decline Reason" : "Supervisor Feedback"}
                      </p>
                      <p className="text-xs text-text-secondary font-body">{sub.feedback}</p>
                      {sub.reviewedAt && (
                        <p className="text-2xs text-text-muted font-mono mt-1.5">
                          Reviewed: {formatDateTime(sub.reviewedAt)}
                        </p>
                      )}
                    </div>
                  )}

                  {(sub.status === "REVISION" || sub.status === "REJECTED") && (
                    <Link href={`/artist/submit?assignmentId=${assignment.id}`}>
                      <Button size="sm" icon={<Upload size={13} />} className="mt-3">
                        Resubmit Fixed Art
                      </Button>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CTA */}
        {isActive && (
          <div className="card-premium rounded-2xl p-6 text-center bg-neon/3 border border-neon/15">
            <h3 className="text-base font-display font-bold text-text-primary mb-2">Ready to submit?</h3>
            <p className="text-sm text-text-muted font-body mb-4">
              Upload your completed files and add notes for the supervisor.
            </p>
            <Link href={`/artist/submit?assignmentId=${assignment.id}`}>
              <Button icon={<Upload size={16} />} size="lg">Submit Artwork</Button>
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
