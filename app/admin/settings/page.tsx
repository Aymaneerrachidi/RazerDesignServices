"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Settings } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <DashboardLayout title="Settings" subtitle="Platform configuration" requiredRole="super_admin">
      <div className="card-premium rounded-2xl p-16 text-center">
        <Settings size={40} className="text-text-muted mx-auto mb-4" />
        <p className="text-text-primary font-display font-bold text-lg">Platform Settings</p>
        <p className="text-text-muted font-body text-sm mt-2">Settings panel coming soon.</p>
      </div>
    </DashboardLayout>
  );
}
