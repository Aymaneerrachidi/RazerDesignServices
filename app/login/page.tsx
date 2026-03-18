"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Layers, ArrowRight, Lock, Mail } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";


export default function LoginPage() {
  const { user, login, isLoading } = useAuth();
  const router = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === "super_admin")     router.push("/admin/dashboard");
      else if (user.role === "supervisor") router.push("/supervisor/dashboard");
      else                                 router.push("/artist/dashboard");
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const ok = await login(email, password);
    if (!ok) setError("Invalid email or password.");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-void bg-grid relative overflow-hidden flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-neon/3 blur-[120px] pointer-events-none" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="absolute h-px w-full opacity-[0.04]"
            style={{ top: `${20 * (i + 1)}%`, background: "linear-gradient(90deg, transparent, #00E87A, transparent)" }} />
        ))}
        {[...Array(5)].map((_, i) => (
          <div key={i} className="absolute w-px h-full opacity-[0.04]"
            style={{ left: `${20 * (i + 1)}%`, background: "linear-gradient(180deg, transparent, #00E87A, transparent)" }} />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-md" style={{ animation: "slideUp 0.5s cubic-bezier(0.16,1,0.3,1)" }}>
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-neon/10 border border-neon/25 flex items-center justify-center mb-4 shadow-neon-sm">
            <Layers size={28} className="text-neon" />
          </div>
          <h1 className="text-3xl font-display font-bold text-text-primary tracking-wider text-glow">
            RAZER<span className="text-neon"> DESIGN</span>
          </h1>
          <p className="text-sm text-text-muted font-body mt-1 tracking-widest uppercase">
            Creative Operations Platform
          </p>
        </div>

        <div className="card-premium rounded-2xl border border-[var(--border)] overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.6)]">
          <div className="neon-line" />
          <div className="p-8">
            <h2 className="text-xl font-display font-bold text-text-primary mb-1 tracking-wide">Sign In</h2>
            <p className="text-sm text-text-secondary font-body mb-6">Access your workspace below</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail size={15} />}
                required
              />
              <Input
                label="Password"
                type={showPass ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock size={15} />}
                suffix={
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="text-text-muted hover:text-text-primary transition-colors">
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
                required
              />

              {error && (
                <div className="px-4 py-3 rounded-lg bg-red-500/8 border border-red-500/20 text-red-400 text-sm font-body">
                  {error}
                </div>
              )}

              <Button type="submit" size="lg" loading={loading} className="w-full" icon={<ArrowRight size={16} />}>
                Access Workspace
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
