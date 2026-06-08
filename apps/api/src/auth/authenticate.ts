import type { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../db";
import { extractBearer, verifyApiKey } from "./apiKey";
import { checkIpAllowlist } from "./ipAllowlist";
import { writeAudit } from "../services/audit";

export async function apiKeyAuth(req: FastifyRequest, reply: FastifyReply) {
  const token = extractBearer(req.headers.authorization);
  if (!token) {
    return reply.code(401).send({
      error: { code: "UNAUTHORIZED", message: "missing bearer token", requestId: req.requestId ?? null },
    });
  }

  const prefix = token.slice(0, 16);
  const candidates = await prisma.apiKey.findMany({
    where: { keyPrefix: prefix, revokedAt: null, client: { status: "active", deletedAt: null } },
    include: { client: { include: { system: true } } },
    take: 5,
  });

  let matched: (typeof candidates)[number] | null = null;
  for (const key of candidates) {
    if (await verifyApiKey(token, key.keyHash)) {
      matched = key;
      break;
    }
  }

  if (!matched) {
    await writeAudit({
      actorLabel: "anonymous",
      action: "auth.apikey_invalid",
      targetType: "api_key",
      targetId: prefix,
      ip: req.ip,
    });
    return reply.code(401).send({
      error: { code: "UNAUTHORIZED", message: "invalid api key", requestId: req.requestId ?? null },
    });
  }

  const client = matched.client;
  if (client.system.status !== "active") {
    return reply.code(403).send({
      error: { code: "SYSTEM_DISABLED", message: "source system disabled", requestId: req.requestId ?? null },
    });
  }

  if (!checkIpAllowlist(req.ip, client.ipAllowlist)) {
    await writeAudit({
      actorLabel: `apikey:${client.system.code}`,
      action: "auth.ip_denied",
      targetType: "api_client",
      targetId: client.ref,
      ip: req.ip,
      meta: { allowlist: client.ipAllowlist },
    });
    return reply.code(403).send({
      error: { code: "IP_DENIED", message: "ip not allowed", requestId: req.requestId ?? null },
    });
  }

  req.authedClient = {
    clientId: client.id,
    clientRef: client.ref,
    systemId: client.systemId,
    systemCode: client.system.code,
    scopes: client.scopes,
  };

  await prisma.apiKey.update({
    where: { id: matched.id },
    data: { lastUsedAt: new Date() },
  });
}
