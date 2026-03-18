/**
 * Prisma Seed Script
 *
 * Demo credentials after seeding:
 *   Super Admin:  admin@rds.com      / Admin@12345
 *   Supervisor:   charlie@rds.com    / Super@12345
 */

import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...\n");

  // ── Wipe existing data (order matters for FK constraints) ─────────────────
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.messageReadReceipt.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.conversationParticipant.deleteMany({});
  await prisma.conversation.deleteMany({});
  await prisma.submissionComment.deleteMany({});
  await prisma.submissionFile.deleteMany({});
  await prisma.submission.deleteMany({});
  await prisma.assignmentAttachment.deleteMany({});
  await prisma.assignment.deleteMany({});
  await prisma.supervisorArtist.deleteMany({});
  await prisma.passwordReset.deleteMany({});
  await prisma.invite.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.region.deleteMany({});

  console.log("✓ Cleared existing data");

  // ── Regions ───────────────────────────────────────────────────────────────
  const regionUS = await prisma.region.create({
    data: { name: "United States", code: "US", timezone: "America/New_York" },
  });

  console.log("✓ Region created");

  // ── Passwords ─────────────────────────────────────────────────────────────
  const adminPw      = await hash("Admin@12345", 12);
  const supervisorPw = await hash("Super@12345", 12);

  // ── Super Admin ───────────────────────────────────────────────────────────
  const superAdmin = await prisma.user.create({
    data: {
      fullName:      "System Admin",
      email:         "admin@rds.com",
      passwordHash:  adminPw,
      role:          "SUPER_ADMIN",
      status:        "ACTIVE",
      country:       "US",
      timezone:      "America/New_York",
      emailVerified: true,
      bio:           "Platform super administrator",
      avatarUrl:     "https://api.dicebear.com/9.x/avataaars/svg?seed=SystemAdmin",
    },
  });

  // ── Supervisor ────────────────────────────────────────────────────────────
  const charlie = await prisma.user.create({
    data: {
      fullName:      "Charlie Bolton",
      email:         "charlie@rds.com",
      passwordHash:  supervisorPw,
      role:          "SUPERVISOR",
      status:        "ACTIVE",
      country:       "US",
      timezone:      "America/New_York",
      emailVerified: true,
      bio:           "Creative Director",
      avatarUrl:     "https://api.dicebear.com/9.x/avataaars/svg?seed=CharlieBolton",
    },
  });

  console.log("✓ Users created");

  // ── Audit log ─────────────────────────────────────────────────────────────
  await prisma.auditLog.createMany({
    data: [
      { performedBy: superAdmin.id, action: "USER_CREATED", resource: `user:${charlie.id}`, metadata: { email: charlie.email } as any },
    ],
  });

  console.log("✓ Audit logs seeded\n");

  console.log("═══════════════════════════════════════════════════");
  console.log("  ✅ Database seeded successfully!\n");
  console.log("  Demo Accounts:");
  console.log("  ┌─────────────────────────────────────────────┐");
  console.log("  │ SUPER ADMIN  admin@rds.com   / Admin@12345  │");
  console.log("  │ SUPERVISOR   charlie@rds.com / Super@12345  │");
  console.log("  └─────────────────────────────────────────────┘");
  console.log("═══════════════════════════════════════════════════\n");
}

main()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
