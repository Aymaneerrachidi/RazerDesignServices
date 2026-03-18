import { NextRequest } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isSuperAdmin, isSupervisor, getAccessibleArtistIds } from "@/lib/permissions";
import { ok, created, forbidden, unauthorized, serverError, error } from "@/lib/api-response";
import { hash } from "bcryptjs";
import { auditLog } from "@/lib/audit";

/** GET /api/users — List users based on role */
export async function GET(req: NextRequest) {
  const session = await getAuth();
  if (!session) return unauthorized();

  const user = { id: session.user.id, role: session.user.role };
  const { searchParams } = req.nextUrl;
  const role    = searchParams.get("role");
  const search  = searchParams.get("search") ?? "";
  const country = searchParams.get("country");

  try {
    if (isSuperAdmin(user)) {
      // Super admin sees all users
      const users = await prisma.user.findMany({
        where: {
          role:   (role as any) ?? undefined,
          country: country ?? undefined,
          OR: search
            ? [
                { fullName: { contains: search, mode: "insensitive" } },
                { email:    { contains: search, mode: "insensitive" } },
              ]
            : undefined,
        },
        select: {
          id: true, fullName: true, email: true, role: true,
          status: true, country: true, timezone: true,
          avatarUrl: true, specialty: true, isOnline: true,
          lastSeenAt: true, createdAt: true,
          _count: {
            select: {
              assignmentsAssigned: true,
              submissions: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return ok(users);
    }

    if (isSupervisor(user)) {
      // Supervisor sees only their assigned artists
      const artistIds = await getAccessibleArtistIds(user);
      const artists = await prisma.user.findMany({
        where: {
          id:     { in: artistIds },
          status: "ACTIVE",
          OR: search
            ? [
                { fullName: { contains: search, mode: "insensitive" } },
                { email:    { contains: search, mode: "insensitive" } },
              ]
            : undefined,
        },
        select: {
          id: true, fullName: true, email: true, role: true,
          country: true, timezone: true, avatarUrl: true,
          specialty: true, bio: true, isOnline: true, lastSeenAt: true,
          _count: {
            select: { assignmentsAssigned: true, submissions: true },
          },
        },
        orderBy: { fullName: "asc" },
      });
      return ok(artists);
    }

    return forbidden();
  } catch (err) {
    console.error("[GET /api/users]", err);
    return serverError();
  }
}

/** POST /api/users — Supervisor/Admin creates an artist account directly */
export async function POST(req: NextRequest) {
  const session = await getAuth();
  if (!session) return unauthorized();

  const actor = { id: session.user.id, role: session.user.role };
  if (!isSupervisor(actor)) return forbidden();

  try {
    const body = await req.json();
    const { fullName, email, password, specialty, country, timezone } = body as {
      fullName:   string;
      email:      string;
      password:   string;
      specialty?: string;
      country?:   string;
      timezone?:  string;
    };

    if (!fullName || !email || !password) return error("fullName, email, and password are required");
    if (password.length < 6) return error("Password must be at least 6 characters");

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existing) return error("A user with this email already exists");

    const passwordHash = await hash(password, 12);

    const newUser = await prisma.user.create({
      data: {
        fullName:      fullName.trim(),
        email:         email.toLowerCase().trim(),
        passwordHash,
        role:          "ARTIST",
        status:        "ACTIVE",
        emailVerified: true,
        specialty:     specialty?.trim() || null,
        country:       country?.trim() || null,
        timezone:      timezone || "UTC",
        avatarUrl:     `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(fullName.trim())}`,
        artistRelations: isSuperAdmin(actor)
          ? undefined
          : {
              create: {
                supervisorId: actor.id,
                isActive:     true,
              },
            },
      },
      select: {
        id: true, fullName: true, email: true, role: true,
        specialty: true, country: true, avatarUrl: true, createdAt: true,
      },
    });

    await auditLog({
      performedBy: actor.id,
      action:      "USER_CREATED",
      resource:    `user:${newUser.id}`,
      metadata:    { email: newUser.email, role: "ARTIST", createdBy: actor.id },
    });

    return created(newUser);
  } catch (err) {
    console.error("[POST /api/users]", err);
    return serverError();
  }
}
