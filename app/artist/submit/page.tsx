"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Upload, X, CheckCircle, ArrowRight } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Select, Textarea } from "@/components/ui/Input";
import { getFileIcon, formatFileSize } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  status: string;
}

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
}

const ALLOWED_TYPES = ["jpg", "jpeg", "png", "pdf", "psd", "ai", "zip"];

function ArtistSubmitForm() {
  const searchParams = useSearchParams();
  const preselectedAssignment = searchParams.get("assignmentId") ?? "";
  const [assignments,        setAssignments]        = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState("");
  const [files,              setFiles]              = useState<UploadedFile[]>([]);
  const [note,               setNote]               = useState("");
  const [dragging,           setDragging]           = useState(false);
  const [submitting,         setSubmitting]         = useState(false);
  const [uploadProgress,     setUploadProgress]     = useState("");
  const [success,            setSuccess]            = useState(false);
  const [error,              setError]              = useState("");

  useEffect(() => {
    fetch("/api/assignments")
      .then((r) => r.json())
      .then((d) => {
        const active = (d.data ?? []).filter((a: Assignment) =>
          ["PENDING", "IN_PROGRESS", "REVISION"].includes(a.status.toUpperCase()) ||
          a.id === preselectedAssignment
        );
        setAssignments(active);
        if (preselectedAssignment && active.some((a: Assignment) => a.id === preselectedAssignment)) {
          setSelectedAssignment(preselectedAssignment);
        } else if (active.length > 0) {
          setSelectedAssignment(active[0].id);
        }
      })
      .catch(() => {});
  }, [preselectedAssignment]);

  const handleFiles = useCallback((newFiles: FileList | null) => {
    if (!newFiles) return;
    setError("");
    const added: UploadedFile[] = [];
    Array.from(newFiles).forEach((file) => {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      if (!ALLOWED_TYPES.includes(ext)) {
        setError(`File type .${ext} is not allowed.`);
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        setError("File must be under 100MB.");
        return;
      }
      added.push({
        id:   `${Date.now()}-${Math.random()}`,
        file,
        name: file.name,
        size: file.size,
        type: ext,
      });
    });
    setFiles((prev) => [...prev, ...added]);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment || files.length === 0) return;
    setSubmitting(true);
    setError("");

    try {
      // Upload each file to Cloudinary
      const uploadedFiles: Array<{
        fileName: string; fileUrl: string; fileSize: number; mimeType: string; publicId: string;
      }> = [];

      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        setUploadProgress(`Uploading ${i + 1}/${files.length}: ${f.name}`);

        const formData = new FormData();
        formData.append("file",   f.file);
        formData.append("folder", "rds/submissions");

        const res  = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? `Failed to upload ${f.name}`);
          return;
        }

        uploadedFiles.push({
          fileName: data.data.fileName,
          fileUrl:  data.data.url,
          fileSize: data.data.fileSize,
          mimeType: data.data.mimeType,
          publicId: data.data.publicId,
        });
      }

      setUploadProgress("Creating submission…");

      const res  = await fetch("/api/submissions", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: selectedAssignment,
          note:         note || undefined,
          files:        uploadedFiles,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to create submission.");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
      setUploadProgress("");
    }
  };

  const selectedMeta = assignments.find((a) => a.id === selectedAssignment);

  return (
    <DashboardLayout
      title="Submit Artwork"
      subtitle="Upload your completed work for review"
      requiredRole="artist"
    >
      {success ? (
        <div
          className="max-w-xl mx-auto text-center py-20"
          style={{ animation: "slideUp 0.4s cubic-bezier(0.16,1,0.3,1)" }}
        >
          <div className="w-24 h-24 rounded-full bg-neon/10 border border-neon/25 flex items-center justify-center mx-auto mb-6 shadow-neon">
            <CheckCircle size={40} className="text-neon" />
          </div>
          <h2 className="text-2xl font-display font-bold text-text-primary mb-2">
            Submitted Successfully!
          </h2>
          <p className="text-text-secondary font-body mb-2">
            Your artwork has been sent to the supervisor for review.
          </p>
          <p className="text-sm text-text-muted font-body mb-8">
            You&apos;ll be notified when feedback is available.
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              variant="neon-outline"
              onClick={() => { setSuccess(false); setFiles([]); setNote(""); }}
            >
              Submit Another
            </Button>
            <Button icon={<ArrowRight size={15} />} onClick={() => window.location.href = "/artist/submissions"}>
              View History
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-5">
          {/* Assignment selector */}
          <div className="card-premium rounded-2xl p-5 space-y-4">
            <div className="neon-line -mx-5 -mt-5 rounded-t-2xl" />
            <h3 className="text-sm font-display font-bold text-text-primary pt-1">Assignment</h3>

            {assignments.length === 0 ? (
              <div className="text-center py-6 text-text-muted">
                <p className="font-body text-sm">No active assignments available for submission.</p>
              </div>
            ) : (
              <Select
                label="Select Assignment"
                value={selectedAssignment}
                onChange={(e) => setSelectedAssignment(e.target.value)}
                options={assignments.map((a) => ({ value: a.id, label: a.title }))}
              />
            )}

            {selectedMeta?.description && (
              <div className="p-3 rounded-xl bg-white/2 border border-[var(--border)]">
                <p className="text-xs text-text-muted font-body line-clamp-2">{selectedMeta.description}</p>
              </div>
            )}
          </div>

          {/* File upload */}
          <div className="card-premium rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-display font-bold text-text-primary">Files</h3>

            <div
              className={cn("upload-zone rounded-2xl p-10 text-center transition-all duration-300", dragging && "dragging")}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <input
                id="file-input"
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.pdf,.psd,.ai,.zip"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all duration-300",
                dragging ? "bg-neon/15 border border-neon/30" : "bg-white/3 border border-[var(--border)]"
              )}>
                <Upload size={28} className={cn("transition-colors duration-300", dragging ? "text-neon" : "text-text-muted")} />
              </div>
              <p className="text-base font-display font-semibold text-text-primary mb-1">
                {dragging ? "Drop files here" : "Drag & drop your files"}
              </p>
              <p className="text-sm text-text-muted font-body mb-4">or click to browse your computer</p>
              <div className="flex flex-wrap justify-center gap-2">
                {ALLOWED_TYPES.map((ext) => (
                  <span key={ext} className="text-xs text-text-muted font-mono bg-white/4 px-2 py-1 rounded-lg border border-[var(--border)] uppercase">
                    .{ext}
                  </span>
                ))}
              </div>
              <p className="text-xs text-text-muted font-body mt-2">Max 100MB per file</p>
            </div>

            {error && (
              <div className="px-4 py-3 rounded-lg bg-red-500/8 border border-red-500/20 text-red-400 text-sm font-body">
                {error}
              </div>
            )}

            {files.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-text-muted font-display tracking-widest uppercase">
                  Ready to upload ({files.length})
                </p>
                {files.map((f) => (
                  <div key={f.id} className="flex items-center gap-3 p-3 rounded-xl bg-neon/3 border border-neon/15"
                    style={{ animation: "slideUp 0.2s ease-out" }}>
                    <span className="text-xl flex-shrink-0">{getFileIcon(f.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-body text-text-primary truncate">{f.name}</p>
                      <p className="text-xs text-text-muted font-mono">
                        {f.type.toUpperCase()} · {formatFileSize(f.size)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(f.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-red-400 hover:bg-red-400/10 transition-all"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Note */}
          <div className="card-premium rounded-2xl p-5">
            <Textarea
              label="Note to Supervisor (Optional)"
              placeholder="Describe what you've completed, any decisions you made, or context that might help during review..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
            />
          </div>

          {/* Submit */}
          <div className="flex flex-col gap-3">
            {submitting && uploadProgress && (
              <div className="px-4 py-3 rounded-lg bg-neon/5 border border-neon/20 text-neon text-xs font-mono text-center">
                {uploadProgress}
              </div>
            )}
            <Button
              type="submit"
              size="lg"
              loading={submitting}
              className="w-full"
              disabled={!selectedAssignment || files.length === 0}
              icon={<Upload size={16} />}
            >
              {submitting ? "Uploading…" : "Submit for Review"}
            </Button>
            {(files.length === 0 || !selectedAssignment) && !submitting && (
              <p className="text-xs text-text-muted font-body text-center">
                {!selectedAssignment ? "Select an assignment" : "Add at least one file to submit"}
              </p>
            )}
          </div>
        </form>
      )}
    </DashboardLayout>
  );
}

export default function ArtistSubmitPage() {
  return (
    <Suspense>
      <ArtistSubmitForm />
    </Suspense>
  );
}
