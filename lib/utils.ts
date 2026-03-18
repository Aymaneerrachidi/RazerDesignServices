import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { AssignmentStatus, AssignmentPriority, SubmissionStatus, UserStatus } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(dateStr);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export function getDaysUntilDue(dueDate: string): number {
  const now = new Date();
  const due = new Date(dueDate);
  return Math.ceil((due.getTime() - now.getTime()) / 86400000);
}

function normalizeStatus(status: string): string {
  return status.toLowerCase().replace("_", "-");
}

export function getStatusColor(status: AssignmentStatus | SubmissionStatus | string): string {
  const map: Record<string, string> = {
    pending:      "text-amber-400 bg-amber-400/10 border-amber-400/20",
    "in-progress":"text-blue-400 bg-blue-400/10 border-blue-400/20",
    submitted:    "text-violet-400 bg-violet-400/10 border-violet-400/20",
    approved:     "text-neon bg-neon/10 border-neon/20",
    revision:     "text-red-400 bg-red-400/10 border-red-400/20",
    rejected:     "text-red-400 bg-red-400/10 border-red-400/20",
  };
  return map[normalizeStatus(status as string)] ?? "text-gray-400 bg-gray-400/10 border-gray-400/20";
}

export function getPriorityColor(priority: AssignmentPriority | string): string {
  const map: Record<string, string> = {
    low:    "text-gray-400 bg-gray-400/10 border-gray-400/20",
    medium: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    high:   "text-orange-400 bg-orange-400/10 border-orange-400/20",
    urgent: "text-red-400 bg-red-400/10 border-red-400/20",
  };
  return map[(priority as string).toLowerCase()] ?? "text-gray-400 bg-gray-400/10 border-gray-400/20";
}

export function getStatusLabel(status: AssignmentStatus | SubmissionStatus | string): string {
  const map: Record<string, string> = {
    pending:      "Pending",
    "in-progress":"In Progress",
    submitted:    "Submitted",
    approved:     "Approved",
    revision:     "Revision",
    rejected:     "Rejected",
  };
  return map[normalizeStatus(status as string)] ?? (status as string);
}

export function getUserStatusColor(status: UserStatus): string {
  const map: Record<UserStatus, string> = {
    online: "bg-neon",
    offline: "bg-gray-600",
    away: "bg-amber-400",
  };
  return map[status];
}

export function getFileIcon(type: string): string {
  const map: Record<string, string> = {
    pdf: "📄",
    zip: "📦",
    png: "🖼️",
    jpg: "🖼️",
    jpeg: "🖼️",
    psd: "🎨",
    ai: "🎨",
    mp4: "🎬",
    figma: "🖌️",
  };
  return map[type.toLowerCase()] ?? "📁";
}
