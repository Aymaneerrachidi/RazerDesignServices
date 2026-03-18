"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function RootPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        if (user.role === "super_admin")     router.push("/admin/dashboard");
        else if (user.role === "supervisor") router.push("/supervisor/dashboard");
        else                                 router.push("/artist/dashboard");
      } else {
        router.push("/login");
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen bg-void flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-neon/20 border-t-neon animate-spin" />
    </div>
  );
}
