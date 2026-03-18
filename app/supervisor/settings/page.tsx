"use client";

import { useState } from "react";
import { Shield, Bell, Palette, User, Save } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "profile", label: "Profile", icon: <User size={15} /> },
  { id: "notifications", label: "Notifications", icon: <Bell size={15} /> },
  { id: "security", label: "Security", icon: <Shield size={15} /> },
  { id: "appearance", label: "Appearance", icon: <Palette size={15} /> },
];

export default function SupervisorSettings() {
  const { user } = useAuth();
  const { success } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [name, setName] = useState(user?.name ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    setSaving(false);
    success("Settings saved", "Your profile has been updated.");
  };

  return (
    <DashboardLayout title="Settings" subtitle="Manage your account and preferences" requiredRole="supervisor">
      <div className="max-w-3xl mx-auto">
        {/* Tab navigation */}
        <div className="flex gap-1 mb-6 p-1 bg-white/3 rounded-xl border border-[var(--border)] w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-display font-semibold tracking-wide transition-all duration-200",
                activeTab === tab.id
                  ? "bg-neon/10 text-neon border border-neon/20"
                  : "text-text-muted hover:text-text-primary"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "profile" && (
          <div className="card-premium rounded-2xl p-6 space-y-6">
            <div className="neon-line -mx-6 -mt-6 rounded-t-2xl" />
            <h3 className="text-base font-display font-bold text-text-primary pt-2">Profile Information</h3>

            {/* Avatar section */}
            <div className="flex items-center gap-5">
              <Avatar name={user?.name ?? ""} avatar={user?.avatar} size="xl" />
              <div>
                <p className="text-sm font-semibold font-display text-text-primary mb-1">{user?.name}</p>
                <p className="text-xs text-text-muted font-body mb-3">{user?.email}</p>
                <Button variant="ghost" size="sm">Change Avatar</Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                label="Email"
                value={user?.email ?? ""}
                disabled
                className="opacity-50 cursor-not-allowed"
              />
            </div>

            <Textarea
              label="Bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Brief description of your role..."
            />

            <div className="flex justify-end">
              <Button onClick={handleSave} loading={saving} icon={<Save size={15} />}>
                Save Changes
              </Button>
            </div>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="card-premium rounded-2xl p-6 space-y-5">
            <div className="neon-line -mx-6 -mt-6 rounded-t-2xl" />
            <h3 className="text-base font-display font-bold text-text-primary pt-2">Notification Preferences</h3>
            {[
              { label: "New artwork submission", desc: "When an artist submits work for review", enabled: true },
              { label: "New messages", desc: "When an artist sends you a message", enabled: true },
              { label: "Assignment updates", desc: "Status changes on assignments", enabled: false },
              { label: "Weekly summary", desc: "Weekly studio performance digest", enabled: true },
            ].map((item) => (
              <div key={item.label} className="flex items-start justify-between gap-4 py-3 border-b border-[var(--border)] last:border-0">
                <div>
                  <p className="text-sm font-semibold font-display text-text-primary">{item.label}</p>
                  <p className="text-xs text-text-muted font-body mt-0.5">{item.desc}</p>
                </div>
                <div
                  className={cn(
                    "w-11 h-6 rounded-full border transition-all duration-300 flex items-center cursor-pointer flex-shrink-0",
                    item.enabled ? "bg-neon/20 border-neon/30 justify-end" : "bg-white/5 border-[var(--border)] justify-start"
                  )}
                >
                  <div className={cn("w-4 h-4 rounded-full m-1 transition-all", item.enabled ? "bg-neon" : "bg-text-muted")} />
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "security" && (
          <div className="card-premium rounded-2xl p-6 space-y-5">
            <div className="neon-line -mx-6 -mt-6 rounded-t-2xl" />
            <h3 className="text-base font-display font-bold text-text-primary pt-2">Security</h3>
            <div className="space-y-4">
              <Input label="Current Password" type="password" placeholder="••••••••" />
              <Input label="New Password" type="password" placeholder="••••••••" />
              <Input label="Confirm New Password" type="password" placeholder="••••••••" />
            </div>
            <Button icon={<Save size={15} />}>Update Password</Button>

            <div className="mt-6 p-4 rounded-xl bg-red-500/5 border border-red-500/15">
              <p className="text-sm font-display font-bold text-red-400 mb-1">Danger Zone</p>
              <p className="text-xs text-text-muted font-body mb-3">These actions are irreversible.</p>
              <Button variant="danger" size="sm">Deactivate Account</Button>
            </div>
          </div>
        )}

        {activeTab === "appearance" && (
          <div className="card-premium rounded-2xl p-6 space-y-5">
            <div className="neon-line -mx-6 -mt-6 rounded-t-2xl" />
            <h3 className="text-base font-display font-bold text-text-primary pt-2">Appearance</h3>
            <p className="text-sm text-text-muted font-body">
              The RDS platform uses a curated dark premium theme. Appearance customization coming soon.
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { name: "Void (Default)", bg: "#060608", accent: "#00E87A" },
                { name: "Midnight", bg: "#0A0A1A", accent: "#6366F1" },
                { name: "Carbon", bg: "#111111", accent: "#F59E0B" },
              ].map((theme) => (
                <div
                  key={theme.name}
                  className={cn(
                    "p-4 rounded-xl border cursor-pointer transition-all",
                    theme.name === "Void (Default)"
                      ? "border-neon/30 bg-neon/5"
                      : "border-[var(--border)] hover:border-white/10"
                  )}
                  style={{ background: theme.bg }}
                >
                  <div className="w-6 h-6 rounded-full mb-2" style={{ background: theme.accent }} />
                  <p className="text-xs font-display font-bold text-text-primary">{theme.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
