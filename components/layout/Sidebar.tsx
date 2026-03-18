"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Briefcase,
  Upload,
  History,
  Settings,
  LogOut,
  Bell,
  FileCheck,
  Shield,
  ScrollText,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { useState, useEffect } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

function NavGroup({ title, items }: { title?: string; items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <div className="space-y-1">
      {title && (
        <p className="px-3 py-1 text-2xs font-bold text-text-muted uppercase tracking-[0.15em] font-display mt-4 mb-1">
          {title}
        </p>
      )}
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link key={item.href} href={item.href} className={cn("nav-item", isActive && "active")}>
            <span className="w-4 h-4 flex-shrink-0 opacity-80">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {item.badge ? (
              <span className="badge-count">{item.badge > 9 ? "9+" : item.badge}</span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}

function SidebarShell({
  children,
  mobileOpen,
  onClose,
  footer,
  roleBadge,
}: {
  children: React.ReactNode;
  mobileOpen?: boolean;
  onClose?: () => void;
  footer: React.ReactNode;
  roleBadge: React.ReactNode;
}) {
  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen z-50 flex flex-col transition-transform duration-300",
          "w-[260px] bg-[#080A0D] border-r border-[var(--border)]",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="px-4 h-16 flex items-center border-b border-[var(--border)] flex-shrink-0">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="RDS" className="w-8 h-8 object-contain" />
            <div>
              <p className="text-sm font-bold font-display tracking-wider text-text-primary leading-none">RDS</p>
              <p className="text-2xs text-text-muted font-body leading-none mt-0.5">Design Services</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-neon animate-pulse-neon" />
            <span className="text-2xs text-neon font-mono">LIVE</span>
          </div>
        </div>

        <div className="px-4 py-2 border-b border-[var(--border)]">{roleBadge}</div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">{children}</nav>

        <div className="p-3 border-t border-[var(--border)] flex-shrink-0">{footer}</div>
      </aside>
    </>
  );
}

export function AdminSidebar({ mobileOpen, onClose }: { mobileOpen?: boolean; onClose?: () => void }) {
  const { user, logout } = useAuth();

  const mainNav: NavItem[] = [
    { label: "Dashboard",   href: "/admin/dashboard",   icon: <LayoutDashboard size={15} /> },
    { label: "Supervisors", href: "/admin/supervisors", icon: <Shield size={15} /> },
    { label: "Artists",     href: "/admin/artists",     icon: <Users size={15} /> },
  ];
  const workNav: NavItem[] = [
    { label: "Assignments", href: "/admin/assignments", icon: <Briefcase size={15} /> },
    { label: "Audit Logs",  href: "/admin/audit-logs",  icon: <ScrollText size={15} /> },
  ];
  const systemNav: NavItem[] = [
    { label: "Settings", href: "/admin/settings", icon: <Settings size={15} /> },
  ];

  return (
    <SidebarShell
      mobileOpen={mobileOpen}
      onClose={onClose}
      roleBadge={
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-amber-400/5 border border-amber-400/10">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span className="text-2xs font-bold text-amber-400 font-display tracking-[0.15em] uppercase">Super Admin</span>
        </div>
      }
      footer={
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/3 transition-colors group">
          <Avatar name={user?.name ?? ""} avatar={user?.avatar} status={user?.status} size="sm" showStatus />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold font-display text-text-primary truncate leading-none">{user?.name}</p>
            <p className="text-2xs text-text-muted font-body truncate mt-0.5">{user?.email}</p>
          </div>
          <button onClick={logout}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
            title="Logout">
            <LogOut size={13} />
          </button>
        </div>
      }
    >
      <NavGroup items={mainNav} />
      <NavGroup title="Management" items={workNav} />
      <NavGroup title="System" items={systemNav} />
    </SidebarShell>
  );
}

export function SupervisorSidebar({ mobileOpen, onClose }: { mobileOpen?: boolean; onClose?: () => void }) {
  const { user, logout } = useAuth();
  const [counts, setCounts] = useState({ messages: 0, submissions: 0 });

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => {
        if (d.data) {
          setCounts({
            messages:    d.data.unreadMessages   ?? 0,
            submissions: d.data.pendingSubmissions ?? 0,
          });
        }
      })
      .catch(() => {});
  }, []);

  const mainNav: NavItem[] = [
    { label: "Dashboard",  href: "/supervisor/dashboard",       icon: <LayoutDashboard size={15} /> },
    { label: "Artists",    href: "/supervisor/artists",         icon: <Users    size={15} /> },
    { label: "Add Artist", href: "/supervisor/artists/create",  icon: <UserPlus size={15} /> },
    { label: "Messages",   href: "/supervisor/chat",            icon: <MessageSquare size={15} />, badge: counts.messages },
  ];
  const workNav: NavItem[] = [
    { label: "Assignments", href: "/supervisor/assignments", icon: <Briefcase size={15} /> },
    { label: "Submissions", href: "/supervisor/submissions", icon: <FileCheck size={15} />, badge: counts.submissions },
  ];
  const systemNav: NavItem[] = [
    { label: "Notifications", href: "/supervisor/notifications", icon: <Bell size={15} /> },
    { label: "Settings",      href: "/supervisor/settings",      icon: <Settings size={15} /> },
  ];

  return (
    <SidebarShell
      mobileOpen={mobileOpen}
      onClose={onClose}
      roleBadge={
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-neon/5 border border-neon/10">
          <div className="w-1.5 h-1.5 rounded-full bg-neon" />
          <span className="text-2xs font-bold text-neon font-display tracking-[0.15em] uppercase">Supervisor Access</span>
        </div>
      }
      footer={
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/3 transition-colors group">
          <Avatar name={user?.name ?? ""} avatar={user?.avatar} status={user?.status} size="sm" showStatus />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold font-display text-text-primary truncate leading-none">{user?.name}</p>
            <p className="text-2xs text-text-muted font-body truncate mt-0.5">{user?.email}</p>
          </div>
          <button onClick={logout}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
            title="Logout">
            <LogOut size={13} />
          </button>
        </div>
      }
    >
      <NavGroup items={mainNav} />
      <NavGroup title="Workflow" items={workNav} />
      <NavGroup title="System" items={systemNav} />
    </SidebarShell>
  );
}

export function ArtistSidebar({ mobileOpen, onClose }: { mobileOpen?: boolean; onClose?: () => void }) {
  const { user, logout } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((d) => {
        if (d.data) {
          const total = (d.data as any[]).reduce((sum: number, c: any) => sum + (c.unreadCount ?? 0), 0);
          setUnreadMessages(total);
        }
      })
      .catch(() => {});
  }, []);

  const mainNav: NavItem[] = [
    { label: "Dashboard",       href: "/artist/dashboard",   icon: <LayoutDashboard size={15} /> },
    { label: "My Assignments",  href: "/artist/assignments", icon: <Briefcase size={15} /> },
    { label: "Chat with Supervisor", href: "/artist/chat",  icon: <MessageSquare size={15} />, badge: unreadMessages },
  ];
  const workNav: NavItem[] = [
    { label: "Submit Artwork",     href: "/artist/submit",      icon: <Upload size={15} /> },
    { label: "Submission History", href: "/artist/submissions", icon: <History size={15} /> },
  ];
  const systemNav: NavItem[] = [
    { label: "Settings", href: "/artist/settings", icon: <Settings size={15} /> },
  ];

  return (
    <SidebarShell
      mobileOpen={mobileOpen}
      onClose={onClose}
      roleBadge={
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-blue-500/5 border border-blue-500/10">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          <span className="text-2xs font-bold text-blue-400 font-display tracking-[0.15em] uppercase">Artist Workspace</span>
        </div>
      }
      footer={
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/3 transition-colors group">
          <Avatar name={user?.name ?? ""} avatar={user?.avatar} status={user?.status} size="sm" showStatus />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold font-display text-text-primary truncate leading-none">{user?.name}</p>
            <p className="text-2xs text-text-muted font-body truncate mt-0.5">{user?.specialty ?? user?.email}</p>
          </div>
          <button onClick={logout}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
            title="Logout">
            <LogOut size={13} />
          </button>
        </div>
      }
    >
      <NavGroup items={mainNav} />
      <NavGroup title="Work" items={workNav} />
      <NavGroup title="System" items={systemNav} />
    </SidebarShell>
  );
}
