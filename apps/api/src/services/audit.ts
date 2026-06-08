// src/server/services/audit.ts

import { prisma } from "../db";
import { genRef } from "../lib/ids";

export async function writeAudit(input: {
  actorLabel: string;
  action: string;
  targetType: string;
  targetId: string;
  ip?: string | null;
  reason?: string | null;
  meta?: unknown;
  userId?: bigint | null;
}) {
  await prisma.auditLog.create({
    data: {
      ref: genRef("aud"),
      actorLabel: input.actorLabel,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      ip: input.ip ?? null,
      reason: input.reason ?? null,
      meta: input.meta as object | undefined,
      userId: input.userId ?? null,
    },
  });
}
