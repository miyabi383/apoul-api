// src/server/routes/routesCrud.ts
// 連携ルート（フロー）の CRUD — ビジュアルエディタから保存

import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { prisma } from "../db";
import { requireScope } from "../auth/scope";
import { genRef } from "../lib/ids";
import { writeAudit } from "../services/audit";

const MappingRule = z.object({
  target: z.string(),
  source: z.string(),
  required: z.boolean().optional(),
});

const UpsertSchema = z.object({
  sourceSystemCode: z.string(),
  targetSystemCode: z.string(),
  eventType: z.string(),
  destinationPath: z.string(),
  destinationKeyTpl: z.string(),
  mapping: z.array(MappingRule),
  enabled: z.boolean().optional(),
  layout: z.record(z.unknown()).optional(),
});

export async function routesCrudRoutes(app: FastifyInstance) {
  app.get("/v1/routes", { preHandler: requireScope("routes:read") }, async (_req, reply) => {
    const routes = await prisma.route.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        sourceSystem: { select: { code: true, name: true } },
        targetSystem: { select: { code: true, name: true } },
        transformRules: { where: { enabled: true }, orderBy: { version: "desc" }, take: 1 },
      },
    });
    return reply.send({
      items: routes.map((r) => ({
        id: r.ref,
        sourceSystemCode: r.sourceSystem.code,
        sourceSystemName: r.sourceSystem.name,
        targetSystemCode: r.targetSystem.code,
        targetSystemName: r.targetSystem.name,
        eventType: r.eventType,
        destinationPath: r.destinationPath,
        destinationKeyTpl: r.destinationKeyTpl,
        enabled: r.enabled,
        mapping: r.transformRules[0]?.mapping ?? [],
        updatedAt: r.updatedAt.toISOString(),
      })),
    });
  });

  app.post("/v1/routes", { preHandler: requireScope("routes:write") }, async (req, reply) => {
    const parsed = UpsertSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: { code: "VALIDATION_FAILED", message: "invalid body", details: parsed.error.issues } });
    }
    try {
      const created = await upsertRoute(parsed.data);
      await writeAudit({
        actorLabel: actor(req),
        action: "route.create",
        targetType: "route",
        targetId: created.id,
        ip: req.ip,
      });
      return reply.code(201).send(created);
    } catch {
      return reply.code(404).send({ error: { code: "SYSTEM_NOT_FOUND", message: "source or target system not found" } });
    }
  });

  app.patch("/v1/routes/:id", { preHandler: requireScope("routes:write") }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = UpsertSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: { code: "VALIDATION_FAILED", message: "invalid body" } });
    }
    const existing = await prisma.route.findUnique({ where: { ref: id } });
    if (!existing) return reply.code(404).send({ error: { code: "NOT_FOUND", message: "route not found" } });

    const full = await buildUpsertFromExisting(existing.ref, parsed.data);
    const updated = await upsertRoute(full);
    await writeAudit({ actorLabel: actor(req), action: "route.update", targetType: "route", targetId: id, ip: req.ip });
    return reply.send(updated);
  });
}

async function buildUpsertFromExisting(ref: string, patch: Partial<z.infer<typeof UpsertSchema>>) {
  const r = await prisma.route.findUniqueOrThrow({
    where: { ref },
    include: {
      sourceSystem: true,
      targetSystem: true,
      transformRules: { where: { enabled: true }, orderBy: { version: "desc" }, take: 1 },
    },
  });
  return {
    sourceSystemCode: patch.sourceSystemCode ?? r.sourceSystem.code,
    targetSystemCode: patch.targetSystemCode ?? r.targetSystem.code,
    eventType: patch.eventType ?? r.eventType,
    destinationPath: patch.destinationPath ?? r.destinationPath,
    destinationKeyTpl: patch.destinationKeyTpl ?? r.destinationKeyTpl,
    mapping: (patch.mapping ?? r.transformRules[0]?.mapping ?? []) as z.infer<typeof MappingRule>[],
    enabled: patch.enabled ?? r.enabled,
  };
}

async function upsertRoute(data: z.infer<typeof UpsertSchema>) {
  const source = await prisma.system.findUnique({ where: { code: data.sourceSystemCode } });
  const target = await prisma.system.findUnique({ where: { code: data.targetSystemCode } });
  if (!source || !target) throw new Error("system not found");

  const route = await prisma.route.upsert({
    where: {
      sourceSystemId_eventType_targetSystemId: {
        sourceSystemId: source.id,
        eventType: data.eventType,
        targetSystemId: target.id,
      },
    },
    create: {
      ref: genRef("rte"),
      sourceSystemId: source.id,
      targetSystemId: target.id,
      eventType: data.eventType,
      destinationPath: data.destinationPath,
      destinationKeyTpl: data.destinationKeyTpl,
      enabled: data.enabled ?? true,
    },
    update: {
      destinationPath: data.destinationPath,
      destinationKeyTpl: data.destinationKeyTpl,
      enabled: data.enabled ?? true,
    },
  });

  const existingRule = await prisma.transformRule.findFirst({ where: { routeId: route.id, enabled: true } });
  if (existingRule) {
    await prisma.transformRule.update({
      where: { id: existingRule.id },
      data: { mapping: data.mapping as object[] },
    });
  } else {
    await prisma.transformRule.create({
      data: { ref: genRef("trf"), routeId: route.id, mapping: data.mapping as object[] },
    });
  }

  return {
    id: route.ref,
    sourceSystemCode: data.sourceSystemCode,
    targetSystemCode: data.targetSystemCode,
    eventType: data.eventType,
    destinationPath: data.destinationPath,
    destinationKeyTpl: data.destinationKeyTpl,
    mapping: data.mapping,
    enabled: route.enabled,
  };
}

function actor(req: FastifyRequest) {
  return `apikey:${req.authedClient?.systemCode ?? "unknown"}`;
}
