import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import prisma from "./prisma";
import { auditLog } from "./audit";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 }, // 30 days
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        if (!user || user.status !== "ACTIVE") return null;

        const valid = await compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        // Update online status + last seen
        await prisma.user.update({
          where: { id: user.id },
          data: { isOnline: true, lastSeenAt: new Date() },
        });

        await auditLog({
          userId: user.id,
          performedBy: user.id,
          action: "USER_LOGIN",
          metadata: { email: user.email },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
          avatarUrl: user.avatarUrl,
          timezone: user.timezone,
          country: user.country,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id       = user.id;
        token.role     = (user as any).role;
        token.avatarUrl = (user as any).avatarUrl;
        token.timezone = (user as any).timezone;
        token.country  = (user as any).country;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id        = token.id as string;
        session.user.role      = token.role as string;
        session.user.avatarUrl = token.avatarUrl as string;
        session.user.timezone  = token.timezone as string;
        session.user.country   = token.country as string;
      }
      return session;
    },
  },
  events: {
    async signOut({ token }) {
      if (token?.id) {
        await prisma.user.update({
          where: { id: token.id as string },
          data: { isOnline: false, lastSeenAt: new Date() },
        }).catch(() => {});
        await auditLog({
          userId: token.id as string,
          performedBy: token.id as string,
          action: "USER_LOGOUT",
        });
      }
    },
  },
};

export const getAuth = () => getServerSession(authOptions);

// Type augmentation
declare module "next-auth" {
  interface User {
    role: string;
    avatarUrl?: string | null;
    timezone?: string;
    country?: string | null;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      avatarUrl?: string | null;
      timezone?: string;
      country?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    avatarUrl?: string | null;
    timezone?: string;
    country?: string | null;
  }
}
