import prisma from "./prisma";
import type { AuditAction } from "@prisma/client";

interface AuditLogParams {
  userId?: string;
  performedBy?: string;
  action: AuditAction;
  resource?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

export async function auditLog(params: AuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId:      params.userId,
        performedBy: params.performedBy,
        action:      params.action,
        resource:    params.resource,
        metadata:    params.metadata as any,
        ipAddress:   params.ipAddress,
      },
    });
  } catch (err) {
    // Audit log should never crash the app
    console.error("[AUDIT] Failed to write audit log:", err);
  }
}
