"use client";

import Link from "next/link";
import { ShieldOff, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function UnauthorizedPage() {
  const { user } = useAuth();

  const dashboardHref =
    user?.role === "super_admin"
      ? "/admin/dashboard"
      : user?.role === "supervisor"
      ? "/supervisor/dashboard"
      : "/artist/dashboard";

  return (
    <div className="min-h-screen bg-void flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />

      <div className="relative z-10 text-center max-w-md">
        <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
          <ShieldOff size={36} className="text-red-400" />
        </div>

        <h1 className="text-4xl font-display font-bold text-text-primary tracking-wider mb-3">
          ACCESS<span className="text-red-400"> DENIED</span>
        </h1>
        <p className="text-text-secondary font-body mb-8">
          You don&apos;t have permission to access this page.
          {user && (
            <span className="block mt-1 text-sm text-text-muted">
              Your role: <span className="text-neon font-mono uppercase">{user.role.replace("_", " ")}</span>
            </span>
          )}
        </p>

        <Link
          href={user ? dashboardHref : "/login"}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-neon text-black font-display font-bold text-sm tracking-wider hover:bg-neon-bright transition-colors"
        >
          <ArrowLeft size={16} />
          {user ? "Back to Dashboard" : "Go to Login"}
        </Link>
      </div>
    </div>
  );
}
