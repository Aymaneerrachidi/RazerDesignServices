"use client";

import React, { createContext, useContext } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import type { User, UserRole } from "./types";

interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  login: async () => false,
  logout: () => {},
  isLoading: true,
});

function mapRole(role?: string | null): UserRole {
  switch (role?.toUpperCase()) {
    case "SUPER_ADMIN": return "super_admin";
    case "SUPERVISOR":  return "supervisor";
    default:            return "artist";
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";

  const user: User | null = session?.user
    ? {
        id:           session.user.id,
        name:         session.user.name ?? "",
        email:        session.user.email ?? "",
        passwordHash: "",
        role:         mapRole(session.user.role),
        avatar:       session.user.avatarUrl ?? "",
        status:       "online",
        createdAt:    new Date().toISOString(),
        country:      session.user.country ?? undefined,
        timezone:     session.user.timezone ?? undefined,
      }
    : null;

  const login = async (email: string, password: string): Promise<boolean> => {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    return !result?.error;
  };

  const logout = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
