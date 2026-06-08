// src/server/routes/clients.ts
// API Client管理:
//   GET   /v1/api-clients              一覧(clients:read)
//   POST  /v1/api-clients              作成+初回キー発行(clients:write) ※平文は1回だけ返す
//   PATCH /v1/api-clients/:id/revoke   失効(clients:write) ※キーも失効
// 注: 人間のロール認可(admin)はフロント(Next)側で担保。

import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { prisma } from "../db";
import { requireScope } from "../auth/scope";
import { genRef } from "../lib/ids";
import { generateApiKey } from "../auth/apiKey";
import { writeAudit } from "../services/audit";

const CreateSchema = z.object({
  systemCode: z.string().min(1),
  name: z.string().min(1).max(200),
  scopes: z.array(z.string()).min(1),
  ipAllowlist: z.array(z.string()).optional(),
});

export async function clientsRoutes(app: FastifyInstance) {
  app.get("/v1/api-clients", { preHandler: requireScope("clients:read") }, async (req, reply) => {
    const q = req.query as Record<string, string | undefined>;
    const clients = await prisma.apiClient.findMany({
      where: {
        deletedAt: null,
        ...(q.systemCode ? { system: { code: q.systemCode } } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { system: { select: { code: true } }, apiKeys: { orderBy: { createdAt: "desc" } } },
    });
    return reply.send({
      items: clients.map((c) => ({
        id: c.ref,
        systemCode: c.system.code,
        name: c.name,
        scopes: c.scopes,
        status: c.status,
        keys: c.apiKeys.map((k) => ({ prefix: k.keyPrefix, lastUsedAt: k.lastUsedAt, revokedAt: k.revokedAt })),
      })),
    });
  });

  app.post("/v1/api-clients", { preHandler: requireScope("clients:write") }, async (req: FastifyRequest, reply: FastifyReply) => {
    const parsed = CreateSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send(err("VALIDATION_FAILED", "invalid body", req, parsed.error.issues));

    const system = await prisma.system.findUnique({ where: { code: parsed.data.systemCode } });
    if (!system) return reply.code(404).send(err("ROUTE_NOT_FOUND", "system not found", req));

    const client = await prisma.apiClient.create({
      data: {
        ref: genRef("cli"),
        systemId: system.id,
        name: parsed.data.name,
        scopes: parsed.data.scopes,
        ipAllowlist: parsed.data.ipAllowlist ?? [],
        status: "active",
      },
    });
    const issued = await generateApiKey("live");
    await prisma.apiKey.create({ data: { ref: genRef("key"), clientId: client.id, keyHash: issued.keyHash, keyPrefix: issued.keyPrefix } });

    await writeAudit({ actorLabel: actor(req), action: "apikey.issue", targetType: "api_client", targetId: client.ref, ip: req.ip, meta: { systemCode: system.code } });

    // 平文キーはこの応答1回だけ
    return reply.code(201).send({
      client: { id: client.ref, name: client.name, scopes: client.scopes, status: client.status, systemCode: system.code },
      apiKey: { plaintext: issued.plaintext, prefix: issued.keyPrefix },
      warning: "このキーは再表示されません。安全に保管してください。",
    });
  });

  app.patch("/v1/api-clients/:id/revoke", { preHandler: requireScope("clients:write") }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = (req.body ?? {}) as { reason?: string };
    const client = await prisma.apiClient.findUnique({ where: { ref: id } });
    if (!client) return reply.code(404).send(err("ROUTE_NOT_FOUND", "client not found", req));

    const now = new Date();
    await prisma.$transaction([
      prisma.apiClient.update({ where: { id: client.id }, data: { status: "revoked", revokedAt: now } }),
      prisma.apiKey.updateMany({ where: { clientId: client.id, revokedAt: null }, data: { revokedAt: now } }),
    ]);

    await writeAudit({ actorLabel: actor(req), action: "apikey.revoke", targetType: "api_client", targetId: client.ref, ip: req.ip, reason: body.reason ?? null });
    return reply.send({ id: client.ref, status: "revoked", revokedAt: now.toISOString() });
  });
}

function actor(req: FastifyRequest) {
  return `apikey:${req.authedClient?.systemCode ?? "unknown"}`;
}
function err(code: string, message: string, req: FastifyRequest, details?: unknown) {
  return { error: { code, message, requestId: req.requestId ?? null, details } };
}
