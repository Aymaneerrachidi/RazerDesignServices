import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token    = req.nextauth.token;
    const pathname = req.nextUrl.pathname;
    const role     = token?.role as string | undefined;

    // ── Super Admin routes ──
    if (pathname.startsWith("/admin")) {
      if (role !== "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    // ── Supervisor routes ──
    if (pathname.startsWith("/supervisor")) {
      if (role !== "SUPERVISOR" && role !== "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    // ── Artist routes ──
    if (pathname.startsWith("/artist")) {
      if (role !== "ARTIST") {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
      error:  "/login",
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/supervisor/:path*",
    "/artist/:path*",
    "/api/assignments/:path*",
    "/api/submissions/:path*",
    "/api/conversations/:path*",
    "/api/notifications/:path*",
    "/api/users/:path*",
    "/api/upload/:path*",
    "/api/admin/:path*",
    "/api/invites/:path*",
  ],
};
