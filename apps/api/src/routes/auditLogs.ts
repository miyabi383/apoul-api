// src/server/routes/auditLogs.ts

import type { FastifyInstance } from "fastify";
import { prisma } from "../db";
import { requireScope } from "../auth/scope";

export async function auditLogRoutes(app: FastifyInstance) {
  app.get("/v1/audit-logs", { preHandler: requireScope("audit:read") }, async (req, reply) => {
    const q = req.query as Record<string, string | undefined>;
    const logs = await prisma.auditLog.findMany({
      where: {
        ...(q.targetType ? { targetType: q.targetType } : {}),
        ...(q.targetId ? { targetId: q.targetId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return reply.send({
      items: logs.map((l) => ({
        id: l.ref,
        actorLabel: l.actorLabel,
        action: l.action,
        targetType: l.targetType,
        targetId: l.targetId,
        ip: l.ip,
        reason: l.reason,
        meta: l.meta,
        createdAt: l.createdAt.toISOString(),
      })),
    });
  });
}
