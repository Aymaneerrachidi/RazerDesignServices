"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Upload, CheckCircle, XCircle, Clock, RotateCcw, MessageSquare } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
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
  assignment: { id: string; title: string } | null;
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  PENDING:  <Clock size={16} className="text-amber-400" />,
  APPROVED: <CheckCircle size={16} className="text-neon" />,
  REVISION: <RotateCcw size={16} className="text-orange-400" />,
  REJECTED: <XCircle size={16} className="text-red-400" />,
};

export default function ArtistSubmissionsPage() {
  const [submissions, setSubmissions] = useState<ApiSubmission[]>([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    fetch("/api/submissions")
      .then((r) => r.json())
      .then((d) => setSubmissions(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout
      title="Submission History"
      subtitle="Track all your submitted artwork"
      requiredRole="artist"
      headerActions={
        <Link href="/artist/submit">
          <Button size="sm" icon={<Upload size={14} />}>New Submission</Button>
        </Link>
      }
    >
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-neon/20 border-t-neon animate-spin" />
        </div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-20 h-20 rounded-2xl bg-white/3 border border-[var(--border)] flex items-center justify-center mx-auto mb-6">
            <Upload size={32} className="text-text-muted" />
          </div>
          <h3 className="text-xl font-display font-bold text-text-primary mb-2">No submissions yet</h3>
          <p className="text-text-muted font-body mb-6">Submit your first artwork to get started.</p>
          <Link href="/artist/submit">
            <Button icon={<Upload size={16} />}>Submit Artwork</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((sub) => (
            <div key={sub.id} className={cn(
              "card-premium rounded-2xl overflow-hidden",
              sub.status === "REVISION" && "border-orange-400/20",
              sub.status === "APPROVED" && "border-neon/20"
            )}>
              <div className="neon-line" />
              <div className="p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="text-sm font-display font-bold text-text-primary">
                      {sub.assignment?.title ?? "Submission"}
                    </p>
                    <p className="text-xs text-text-muted font-mono mt-0.5">
                      v{sub.versionNumber} · {formatDateTime(sub.submittedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {STATUS_ICON[sub.status]}
                    <StatusBadge status={sub.status} />
                  </div>
                </div>

                {sub.note && (
                  <p className="text-xs text-text-secondary font-body mb-4 bg-white/3 rounded-lg px-3 py-2 border border-[var(--border)]">
                    {sub.note}
                  </p>
                )}

                {/* Files */}
                {sub.files.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {sub.files.map((file) => (
                      <a key={file.id} href={file.fileUrl} target="_blank" rel="noreferrer"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/3 border border-[var(--border)] hover:border-neon/20 transition-colors group">
                        <span className="text-lg">{getFileIcon(file.mimeType.split("/")[1] ?? "")}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-body text-text-primary truncate group-hover:text-neon transition-colors">{file.fileName}</p>
                          <p className="text-2xs text-text-muted font-mono">{formatFileSize(file.fileSize)}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                )}

                {/* Feedback */}
                {sub.feedback && (
                  <div className={cn(
                    "rounded-xl px-4 py-3 border",
                    sub.status === "REVISION"
                      ? "bg-orange-400/5 border-orange-400/20"
                      : sub.status === "APPROVED"
                      ? "bg-neon/5 border-neon/20"
                      : "bg-white/3 border-[var(--border)]"
                  )}>
                    <p className="text-xs font-bold font-display mb-1 flex items-center gap-2">
                      <MessageSquare size={12} />
                      Feedback
                    </p>
                    <p className="text-xs font-body text-text-secondary">{sub.feedback}</p>
                    {sub.reviewedAt && (
                      <p className="text-2xs text-text-muted font-mono mt-2">Reviewed {formatDateTime(sub.reviewedAt)}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
