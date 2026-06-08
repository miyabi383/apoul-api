// src/server/routes/systems.ts
// System管理API:
//   GET   /v1/systems        一覧(systems:read)
//   POST  /v1/systems        登録(systems:write)
//   GET   /v1/systems/:id     詳細(systems:read) ※:id は ref(sys_xxx)
//   PATCH /v1/systems/:id     更新(systems:write) ※code は不変
// 注: 人間のロール認可(admin)はフロント(Next)側の route handler で担保。

import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { prisma } from "../db";
import { requireScope } from "../auth/scope";
import { genRef } from "../lib/ids";
import { writeAudit } from "../services/audit";

const CreateSchema = z.object({
  code: z.string().min(1).max(64).regex(/^[a-z][a-z0-9_]*$/, "code は小文字英数字とアンダースコア"),
  name: z.string().min(1).max(200),
  baseUrl: z.string().url().optional(),
  secretRef: z.string().max(200).optional(),
});

const PatchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  baseUrl: z.string().url().nullable().optional(),
  secretRef: z.string().max(200).nullable().optional(),
  status: z.enum(["active", "disabled"]).optional(),
});

export async function systemsRoutes(app: FastifyInstance) {
  app.get("/v1/systems", {
    schema: {
      tags: ["systems"],
      summary: "システム一覧",
      security: [{ bearerAuth: [] }],
    },
    preHandler: requireScope("systems:read"),
  }, async (req, reply) => {
    const q = req.query as Record<string, string | undefined>;
    const systems = await prisma.system.findMany({
      where: { deletedAt: null, ...(q.status ? { status: q.status as "active" | "disabled" } : {}) },
      orderBy: { code: "asc" },
      include: { _count: { select: { apiClients: true } } },
    });
    return reply.send({
      items: systems.map((s) => ({
        id: s.ref,
        code: s.code,
        name: s.name,
        status: s.status,
        baseUrl: s.baseUrl,
        clients: s._count.apiClients,
        updatedAt: s.updatedAt,
      })),
    });
  });

  app.post("/v1/systems", { preHandler: requireScope("systems:write") }, async (req: FastifyRequest, reply: FastifyReply) => {
    const parsed = CreateSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send(err("VALIDATION_FAILED", "invalid body", req, parsed.error.issues));

    const exists = await prisma.system.findUnique({ where: { code: parsed.data.code } });
    if (exists) return reply.code(409).send(err("SYSTEM_CODE_EXISTS", "code already used", req));

    const s = await prisma.system.create({
      data: { ref: genRef("sys"), code: parsed.data.code, name: parsed.data.name, baseUrl: parsed.data.baseUrl, secretRef: parsed.data.secretRef },
    });
    await writeAudit({ actorLabel: actor(req), action: "system.create", targetType: "system", targetId: s.ref, ip: req.ip, meta: { code: s.code } });
    return reply.code(201).send({ id: s.ref, code: s.code, name: s.name, status: s.status });
  });

  app.get("/v1/systems/:id", { preHandler: requireScope("systems:read") }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const s = await prisma.system.findUnique({
      where: { ref: id },
      include: { apiClients: { include: { apiKeys: { orderBy: { createdAt: "desc" } } } } },
    });
    if (!s) return reply.code(404).send(err("ROUTE_NOT_FOUND", "system not found", req));
    return reply.send({
      id: s.ref,
      code: s.code,
      name: s.name,
      status: s.status,
      baseUrl: s.baseUrl,
      secretRef: s.secretRef,
      clients: s.apiClients.map((c) => ({
        id: c.ref,
        name: c.name,
        scopes: c.scopes,
        status: c.status,
        keys: c.apiKeys.map((k) => ({ prefix: k.keyPrefix, lastUsedAt: k.lastUsedAt, revokedAt: k.revokedAt })),
      })),
    });
  });

  app.patch("/v1/systems/:id", { preHandler: requireScope("systems:write") }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = PatchSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send(err("VALIDATION_FAILED", "invalid body", req, parsed.error.issues));

    const s = await prisma.system.findUnique({ where: { ref: id } });
    if (!s) return reply.code(404).send(err("ROUTE_NOT_FOUND", "system not found", req));

    const updated = await prisma.system.update({ where: { id: s.id }, data: parsed.data });
    const action = parsed.data.status && parsed.data.status !== s.status ? `system.${parsed.data.status === "disabled" ? "disable" : "enable"}` : "system.update";
    await writeAudit({ actorLabel: actor(req), action, targetType: "system", targetId: s.ref, ip: req.ip, meta: { code: s.code } });
    return reply.send({ id: updated.ref, code: updated.code, name: updated.name, status: updated.status, baseUrl: updated.baseUrl });
  });
}

function actor(req: FastifyRequest) {
  return `apikey:${req.authedClient?.systemCode ?? "unknown"}`;
}
function err(code: string, message: string, req: FastifyRequest, details?: unknown) {
  return { error: { code, message, requestId: req.requestId ?? null, details } };
}
