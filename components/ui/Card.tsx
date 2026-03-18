"use client";

import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  onClick?: () => void;
  hoverable?: boolean;
}

export function Card({ children, className, glow, onClick, hoverable }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "card-premium rounded-xl transition-all duration-300",
        hoverable && "cursor-pointer hover:border-[rgba(0,232,122,0.2)] hover:shadow-card-hover",
        glow && "shadow-neon border-[rgba(0,232,122,0.3)]",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; label: string };
  color?: "neon" | "blue" | "amber" | "violet" | "red";
  className?: string;
}

const colorMap = {
  neon: {
    icon: "bg-neon/10 text-neon border border-neon/20",
    glow: "rgba(0,232,122,0.08)",
  },
  blue: {
    icon: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    glow: "rgba(59,130,246,0.08)",
  },
  amber: {
    icon: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    glow: "rgba(245,158,11,0.08)",
  },
  violet: {
    icon: "bg-violet-500/10 text-violet-400 border border-violet-500/20",
    glow: "rgba(139,92,246,0.08)",
  },
  red: {
    icon: "bg-red-500/10 text-red-400 border border-red-500/20",
    glow: "rgba(239,68,68,0.08)",
  },
};

export function StatCard({ label, value, icon, trend, color = "neon", className }: StatCardProps) {
  const colors = colorMap[color];
  return (
    <Card
      className={cn("p-6 group hover:scale-[1.01]", className)}
      hoverable
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={cn(
            "w-11 h-11 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110",
            colors.icon
          )}
        >
          {icon}
        </div>
        {trend && (
          <span
            className={cn(
              "text-xs font-semibold px-2 py-1 rounded-md",
              trend.value >= 0
                ? "text-neon bg-neon/10"
                : "text-red-400 bg-red-400/10"
            )}
          >
            {trend.value >= 0 ? "+" : ""}
            {trend.value} {trend.label}
          </span>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-3xl font-display font-bold text-text-primary tracking-tight">
          {value}
        </p>
        <p className="text-sm text-text-secondary font-body">{label}</p>
      </div>
    </Card>
  );
}
