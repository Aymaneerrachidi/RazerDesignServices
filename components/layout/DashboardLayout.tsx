"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { SupervisorSidebar, ArtistSidebar, AdminSidebar } from "./Sidebar";
import { Header } from "./Header";
import { ToastProvider } from "@/components/ui/Toast";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
  requiredRole?: "supervisor" | "artist" | "super_admin";
}

export function DashboardLayout({
  children,
  title,
  subtitle,
  headerActions,
  requiredRole,
}: DashboardLayoutProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
      return;
    }
    if (!isLoading && user && requiredRole) {
      // Super admin can access everything
      if (user.role === "super_admin") return;
      if (user.role !== requiredRole) {
        if (user.role === "supervisor") router.push("/supervisor/dashboard");
        else if (user.role === "artist") router.push("/artist/dashboard");
        else router.push("/admin/dashboard");
      }
    }
  }, [user, isLoading, router, requiredRole]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-neon/20 border-t-neon animate-spin" />
          <p className="text-text-muted text-sm font-body">Loading workspace...</p>
        </div>
      </div>
    );
  }

  const Sidebar =
    user.role === "super_admin"
      ? AdminSidebar
      : user.role === "supervisor"
      ? SupervisorSidebar
      : ArtistSidebar;

  return (
    <ToastProvider>
      <div className="min-h-screen bg-void bg-grid bg-grid">
        <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

        <div className="md:pl-[260px] min-h-screen">
          <Header
            title={title}
            subtitle={subtitle}
            onMenuClick={() => setMobileOpen(true)}
            actions={headerActions}
          />

          <main className="pt-16 min-h-screen">
            <div className="p-4 md:p-6 lg:p-8 page-enter">{children}</div>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
