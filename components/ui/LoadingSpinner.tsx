"use client";

import { cn } from "@/lib/utils";

export function LoadingSpinner({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const sizes = { sm: "w-5 h-5", md: "w-8 h-8", lg: "w-12 h-12" };
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div
        className={cn(
          "rounded-full border-2 border-neon/20 border-t-neon animate-spin",
          sizes[size]
        )}
      />
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="min-h-screen bg-void flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-neon/20 border-t-neon animate-spin" />
        <p className="text-text-muted text-sm font-body">Loading...</p>
      </div>
    </div>
  );
}
