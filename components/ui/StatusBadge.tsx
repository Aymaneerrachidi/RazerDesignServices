"use client";

import { cn, getStatusColor, getStatusLabel, getPriorityColor } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border font-body tracking-wide",
        getStatusColor(status),
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {getStatusLabel(status)}
    </span>
  );
}

interface PriorityBadgeProps {
  priority: string;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const p = priority.toLowerCase();
  const labels: Record<string, string> = {
    low: "Low", medium: "Medium", high: "High", urgent: "Urgent",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border font-body tracking-wide",
        getPriorityColor(priority),
        className
      )}
    >
      {p === "urgent" && "⚡ "}
      {labels[p] ?? priority}
    </span>
  );
}
