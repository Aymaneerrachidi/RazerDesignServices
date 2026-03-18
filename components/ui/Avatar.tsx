"use client";

import { cn, getUserStatusColor } from "@/lib/utils";
import type { UserStatus } from "@/lib/types";

interface AvatarProps {
  name: string;
  avatar?: string;
  status?: UserStatus;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  showStatus?: boolean;
}

const sizeMap = {
  xs: "w-6 h-6 text-xs",
  sm: "w-8 h-8 text-sm",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-lg",
};

const statusSizeMap = {
  xs: "w-1.5 h-1.5 -bottom-0 -right-0",
  sm: "w-2 h-2 bottom-0 right-0",
  md: "w-2.5 h-2.5 bottom-0 right-0",
  lg: "w-3 h-3 bottom-0.5 right-0.5",
  xl: "w-3.5 h-3.5 bottom-0.5 right-0.5",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function Avatar({ name, avatar, status, size = "md", className, showStatus = false }: AvatarProps) {
  const initials = getInitials(name);

  return (
    <div className={cn("relative flex-shrink-0", className)}>
      <div
        className={cn(
          "rounded-full flex items-center justify-center font-display font-bold overflow-hidden",
          "bg-gradient-to-br from-neon/20 to-neon/5 border border-neon/20 text-neon",
          sizeMap[size]
        )}
      >
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      {showStatus && status && (
        <span
          className={cn(
            "absolute border-2 border-void rounded-full",
            getUserStatusColor(status),
            statusSizeMap[size]
          )}
        />
      )}
    </div>
  );
}
