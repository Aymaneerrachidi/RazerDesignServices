"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Mail, Lock, Globe, Palette, Eye, EyeOff, RefreshCw, Copy, Check, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

function generatePassword() {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$!";
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export default function CreateArtistPage() {
  const router = useRouter();

  const [fullName,  setFullName]  = useState("");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState(generatePassword());
  const [specialty, setSpecialty] = useState("");
  const [country,   setCountry]   = useState("");
  const [showPass,  setShowPass]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [formError, setFormError] = useState("");
  const [created,   setCreated]   = useState<{ fullName: string; email: string; password: string } | null>(null);
  const [copied,    setCopied]    = useState<"email" | "pass" | "all" | null>(null);

  const copy = (text: string, key: "email" | "pass" | "all") => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setLoading(true);

    try {
      const res  = await fetch("/api/users", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ fullName, email, password, specialty, country }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? "Failed to create account.");
      } else {
        setCreated({ fullName, email, password });
      }
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (created) {
    return (
      <DashboardLayout title="Artist Created" requiredRole="supervisor">
        <div className="max-w-md mx-auto">
          <div className="card-premium rounded-2xl overflow-hidden">
            <div className="neon-line" />
            <div className="p-8 space-y-6">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-neon/10 border border-neon/30 flex items-center justify-center">
                  <CheckCircle2 size={28} className="text-neon" />
                </div>
                <div>
                  <h2 className="text-lg font-display font-bold text-text-primary">Account Created!</h2>
                  <p className="text-sm text-text-muted font-body mt-1">Share these credentials with <span className="text-text-primary font-semibold">{created.fullName}</span></p>
                </div>
              </div>

              <div className="space-y-3 p-4 rounded-xl bg-white/2 border border-[var(--border)]">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-2xs text-text-muted font-display tracking-widest uppercase">Email</p>
                    <p className="text-sm font-mono text-text-primary mt-0.5 truncate">{created.email}</p>
                  </div>
                  <button onClick={() => copy(created.email, "email")}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-neon hover:bg-neon/8 transition-all flex-shrink-0">
                    {copied === "email" ? <Check size={14} className="text-neon" /> : <Copy size={14} />}
                  </button>
                </div>
                <div className="border-t border-[var(--border)]" />
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-2xs text-text-muted font-display tracking-widest uppercase">Password</p>
                    <p className="text-sm font-mono text-text-primary mt-0.5">{created.password}</p>
                  </div>
                  <button onClick={() => copy(created.password, "pass")}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-neon hover:bg-neon/8 transition-all flex-shrink-0">
                    {copied === "pass" ? <Check size={14} className="text-neon" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <button
                onClick={() => copy(`Email: ${created.email}\nPassword: ${created.password}`, "all")}
                className="w-full py-2.5 rounded-xl border border-dashed border-neon/20 text-xs font-display text-text-muted hover:text-neon hover:border-neon/40 transition-all flex items-center justify-center gap-2"
              >
                {copied === "all" ? <><Check size={13} className="text-neon" /> Copied!</> : <><Copy size={13} /> Copy both</>}
              </button>

              <div className="flex gap-3">
                <Button variant="ghost" size="sm" className="flex-1" onClick={() => { setCreated(null); setFullName(""); setEmail(""); setPassword(generatePassword()); setSpecialty(""); setCountry(""); }}>
                  Add Another
                </Button>
                <Button size="sm" className="flex-1" onClick={() => router.push("/supervisor/artists")}>
                  Done
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Add Artist"
      subtitle="Create a ready-to-use account for a new artist"
      requiredRole="supervisor"
      headerActions={
        <Link href="/supervisor/artists">
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />}>Back</Button>
        </Link>
      }
    >
      <div className="max-w-md mx-auto">
        <div className="card-premium rounded-2xl overflow-hidden">
          <div className="neon-line" />
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Full Name"
                type="text"
                placeholder="Jane Smith"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                icon={<User size={14} />}
                required
              />
              <Input
                label="Email Address"
                type="email"
                placeholder="artist@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail size={14} />}
                required
              />
              <Input
                label="Password"
                type={showPass ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock size={14} />}
                suffix={
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => setPassword(generatePassword())}
                      className="text-text-muted hover:text-neon transition-colors" title="Generate new password">
                      <RefreshCw size={13} />
                    </button>
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="text-text-muted hover:text-text-primary transition-colors ml-1">
                      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                }
                required
              />
              <Input
                label="Specialty (optional)"
                type="text"
                placeholder="e.g. 3D Artist, Illustrator"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                icon={<Palette size={14} />}
              />
              <Input
                label="Country (optional)"
                type="text"
                placeholder="US, GB, MA…"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                icon={<Globe size={14} />}
              />

              {formError && (
                <div className="px-4 py-3 rounded-lg bg-red-500/8 border border-red-500/20 text-red-400 text-xs font-body">
                  {formError}
                </div>
              )}

              <Button type="submit" loading={loading} className="w-full" size="lg">
                Create Account
              </Button>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
