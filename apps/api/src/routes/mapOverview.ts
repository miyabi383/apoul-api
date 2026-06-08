// src/server/routes/mapOverview.ts
// 全体マップ（スフィア版）用の集約 API

import type { FastifyInstance } from "fastify";
import { prisma } from "../db";
import { requireScope } from "../auth/scope";

export async function mapOverviewRoutes(app: FastifyInstance) {
  app.get("/v1/map/overview", { preHandler: requireScope("systems:read") }, async (_req, reply) => {
    const [systems, routes, idMappings, jobCounts, clientCount] = await Promise.all([
      prisma.system.findMany({
        where: { deletedAt: null },
        orderBy: { code: "asc" },
        include: { _count: { select: { apiClients: true, routesFrom: true, routesTo: true } } },
      }),
      prisma.route.findMany({
        where: { enabled: true },
        include: {
          sourceSystem: { select: { code: true, name: true } },
          targetSystem: { select: { code: true, name: true } },
          transformRules: { where: { enabled: true }, orderBy: { version: "desc" }, take: 1 },
        },
      }),
      prisma.idMapping.findMany({
        take: 200,
        orderBy: { updatedAt: "desc" },
        include: { system: { select: { code: true } } },
      }),
      prisma.job.groupBy({ by: ["status"], _count: { status: true } }),
      prisma.apiClient.count({ where: { deletedAt: null, status: "active" } }),
    ]);

    const jobs = Object.fromEntries(jobCounts.map((j) => [j.status, j._count.status]));

    return reply.send({
      hub: { code: "apoul", name: "APOUL 連携ハブ" },
      systems: systems.map((s) => ({
        code: s.code,
        name: s.name,
        status: s.status,
        baseUrl: s.baseUrl,
        clients: s._count.apiClients,
        routesOut: s._count.routesFrom,
        routesIn: s._count.routesTo,
      })),
      routes: routes.map((r) => ({
        id: r.ref,
        source: r.sourceSystem.code,
        sourceName: r.sourceSystem.name,
        target: r.targetSystem.code,
        targetName: r.targetSystem.name,
        eventType: r.eventType,
        destinationPath: r.destinationPath,
        destinationKeyTpl: r.destinationKeyTpl,
        mapping: r.transformRules[0]?.mapping ?? [],
        mappingCount: Array.isArray(r.transformRules[0]?.mapping) ? (r.transformRules[0]?.mapping as unknown[]).length : 0,
      })),
      idMappings: idMappings.map((m) => ({
        system: m.system.code,
        entityType: m.entityType,
        localId: m.localId,
        remoteSystem: m.remoteSystem,
        remoteId: m.remoteId,
      })),
      stats: {
        systems: systems.length,
        routes: routes.length,
        idMappings: idMappings.length,
        clients: clientCount,
        jobs,
      },
    });
  });
}
