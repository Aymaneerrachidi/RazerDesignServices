/**
 * RBAC Permission System
 * All access decisions go through this file.
 * Never rely on frontend-only checks — always call these from API routes.
 */

import prisma from "./prisma";

export type AuthUser = {
  id: string;
  role: string;
  country?: string | null;
};

// ─── Role checks ────────────────────────────────────────────────────────────

export const isSuperAdmin = (user: AuthUser) => user.role === "SUPER_ADMIN";
export const isSupervisor = (user: AuthUser) => user.role === "SUPERVISOR" || isSuperAdmin(user);
export const isArtist     = (user: AuthUser) => user.role === "ARTIST";

// ─── Conversation access ─────────────────────────────────────────────────────

export async function canAccessConversation(
  user: AuthUser,
  conversationId: string
): Promise<boolean> {
  if (isSuperAdmin(user)) return true;

  const participant = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: { conversationId, userId: user.id },
    },
  });
  return !!participant;
}

// ─── Assignment access ────────────────────────────────────────────────────────

export async function canReadAssignment(
  user: AuthUser,
  assignmentId: string
): Promise<boolean> {
  if (isSuperAdmin(user)) return true;

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: { artistId: true, createdById: true, supervisorId: true },
  });
  if (!assignment) return false;

  if (isSupervisor(user)) {
    // Supervisor must be the creator or assigned supervisor
    return (
      assignment.createdById === user.id ||
      assignment.supervisorId === user.id
    );
  }

  // Artist: only their own
  return assignment.artistId === user.id;
}

export async function canWriteAssignment(
  user: AuthUser,
  assignmentId: string
): Promise<boolean> {
  if (isSuperAdmin(user)) return true;
  if (!isSupervisor(user)) return false;

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: { createdById: true, supervisorId: true },
  });
  if (!assignment) return false;
  return (
    assignment.createdById === user.id ||
    assignment.supervisorId === user.id
  );
}

// ─── Submission access ────────────────────────────────────────────────────────

export async function canReadSubmission(
  user: AuthUser,
  submissionId: string
): Promise<boolean> {
  if (isSuperAdmin(user)) return true;

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    select: {
      artistId: true,
      assignment: { select: { createdById: true, supervisorId: true } },
    },
  });
  if (!submission) return false;

  if (isSupervisor(user)) {
    return (
      submission.assignment.createdById === user.id ||
      submission.assignment.supervisorId === user.id
    );
  }

  return submission.artistId === user.id;
}

export async function canReviewSubmission(
  user: AuthUser,
  submissionId: string
): Promise<boolean> {
  if (isSuperAdmin(user)) return true;
  if (!isSupervisor(user)) return false;
  return canReadSubmission(user, submissionId);
}

// ─── User management ─────────────────────────────────────────────────────────

export async function canManageUser(
  actor: AuthUser,
  targetUserId: string
): Promise<boolean> {
  if (isSuperAdmin(actor)) return true;
  if (actor.id === targetUserId) return true; // can manage own profile

  if (isSupervisor(actor)) {
    // Supervisor can only manage artists in their scope
    const rel = await prisma.supervisorArtist.findFirst({
      where: { supervisorId: actor.id, artistId: targetUserId, isActive: true },
    });
    return !!rel;
  }
  return false;
}

// ─── Supervisor can access artist ────────────────────────────────────────────

export async function supervisorCanAccessArtist(
  supervisorId: string,
  artistId: string
): Promise<boolean> {
  const rel = await prisma.supervisorArtist.findFirst({
    where: { supervisorId, artistId, isActive: true },
  });
  return !!rel;
}

// ─── Artist can contact supervisor ───────────────────────────────────────────

export async function artistCanContactSupervisor(
  artistId: string,
  supervisorId: string
): Promise<boolean> {
  const rel = await prisma.supervisorArtist.findFirst({
    where: { supervisorId, artistId, isActive: true },
  });
  return !!rel;
}

// ─── Get accessible artist IDs for supervisor ─────────────────────────────────

export async function getAccessibleArtistIds(
  user: AuthUser
): Promise<string[]> {
  if (isSuperAdmin(user)) {
    const artists = await prisma.user.findMany({
      where: { role: "ARTIST" },
      select: { id: true },
    });
    return artists.map((a) => a.id);
  }
  const rels = await prisma.supervisorArtist.findMany({
    where: { supervisorId: user.id, isActive: true },
    select: { artistId: true },
  });
  return rels.map((r) => r.artistId);
}
