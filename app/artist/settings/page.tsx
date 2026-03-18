"use client";

import { useState } from "react";
import { Shield, Bell, User, Save } from "lucide-react";
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
];

export default function ArtistSettings() {
  const { user } = useAuth();
  const { success } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [name, setName] = useState(user?.name ?? "");
  const [specialty, setSpecialty] = useState(user?.specialty ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    setSaving(false);
    success("Profile updated", "Your changes have been saved.");
  };

  return (
    <DashboardLayout title="Settings" subtitle="Manage your artist profile" requiredRole="artist">
      <div className="max-w-2xl mx-auto">
        <div className="flex gap-1 mb-6 p-1 bg-white/3 rounded-xl border border-[var(--border)] w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-display font-semibold tracking-wide transition-all",
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
            <h3 className="text-base font-display font-bold text-text-primary pt-2">Artist Profile</h3>

            <div className="flex items-center gap-5">
              <Avatar name={user?.name ?? ""} avatar={user?.avatar} size="xl" />
              <div>
                <p className="text-sm font-display font-bold text-text-primary mb-0.5">{user?.name}</p>
                <p className="text-xs text-neon font-body mb-3">{user?.specialty}</p>
                <Button variant="ghost" size="sm">Change Avatar</Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
              <Input label="Email" value={user?.email ?? ""} disabled className="opacity-50 cursor-not-allowed" />
            </div>

            <Input
              label="Specialty / Discipline"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="e.g. Character Design, Motion Graphics"
            />

            <Textarea
              label="Bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="A short description of your work and experience..."
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
            <h3 className="text-base font-display font-bold text-text-primary pt-2">Notifications</h3>
            {[
              { label: "New assignment", desc: "When the supervisor assigns new work to you", enabled: true },
              { label: "Feedback received", desc: "When your submission has been reviewed", enabled: true },
              { label: "Message from supervisor", desc: "When you receive a new message", enabled: true },
              { label: "Deadline reminders", desc: "2 days before assignment due date", enabled: false },
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
                  <div className={cn("w-4 h-4 rounded-full m-1", item.enabled ? "bg-neon" : "bg-text-muted")} />
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
              <Input label="Confirm Password" type="password" placeholder="••••••••" />
            </div>
            <Button icon={<Save size={15} />}>Update Password</Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
