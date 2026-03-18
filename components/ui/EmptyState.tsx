"use client";

import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center py-20 px-6", className)}>
      <div className="w-18 h-18 rounded-2xl bg-white/3 border border-[var(--border)] flex items-center justify-center mb-5 p-4">
        <div className="text-text-muted">{icon}</div>
      </div>
      <h3 className="text-lg font-display font-bold text-text-primary mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-text-muted font-body max-w-sm mb-6">{description}</p>
      )}
      {action}
    </div>
  );
}
