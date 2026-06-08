import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import rateLimit from "@fastify/rate-limit";
import { logOperation } from "../lib/observability";
import { writeAudit } from "../services/audit";

export function loginRateLimitMax(): number {
  return Number(process.env.LOGIN_RATE_LIMIT_MAX ?? 10);
}

export function loginRateLimitWindowMs(): number {
  return Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MS ?? 60_000);
}

export function eventsRateLimitMax(): number {
  return Number(process.env.EVENTS_RATE_LIMIT_MAX ?? 120);
}

export function eventsRateLimitWindowMs(): number {
  return Number(process.env.EVENTS_RATE_LIMIT_WINDOW_MS ?? 60_000);
}

function rateLimitError(req: FastifyRequest, message: string) {
  return {
    statusCode: 429,
    error: {
      code: "RATE_LIMITED",
      message,
      requestId: req.requestId ?? null,
    },
  };
}

async function recordRateLimit(req: FastifyRequest, category: string, message: string): Promise<void> {
  await logOperation({
    category,
    level: "warn",
    message,
    meta: { ip: req.ip, path: req.url },
    requestId: req.requestId ?? null,
  });
  await writeAudit({
    actorLabel: req.authedClient ? `apikey:${req.authedClient.systemCode}` : "anonymous",
    action: "rate_limit.exceeded",
    targetType: "endpoint",
    targetId: req.url,
    ip: req.ip,
    reason: category,
  });
}

export async function registerLoginRateLimit(app: FastifyInstance): Promise<void> {
  await app.register(rateLimit, {
    global: false,
    max: loginRateLimitMax(),
    timeWindow: loginRateLimitWindowMs(),
    keyGenerator: (req) => req.ip,
    errorResponseBuilder: (req) => rateLimitError(req, "too many login attempts"),
    onExceeded: async (req) => {
      await recordRateLimit(req, "auth.login", "login rate limit exceeded");
    },
  });
}

export async function registerEventsRateLimit(app: FastifyInstance): Promise<void> {
  await app.register(rateLimit, {
    global: false,
    max: eventsRateLimitMax(),
    timeWindow: eventsRateLimitWindowMs(),
    keyGenerator: (req) => req.authedClient?.clientRef ?? req.ip,
    errorResponseBuilder: (req) => rateLimitError(req, "too many event requests"),
    onExceeded: async (req) => {
      await recordRateLimit(req, "events.ingest", "events rate limit exceeded");
    },
  });
}

export async function sendScopeDenied(
  req: FastifyRequest,
  reply: FastifyReply,
  scope: string,
): Promise<FastifyReply> {
  await writeAudit({
    actorLabel: req.authedClient ? `apikey:${req.authedClient.systemCode}` : "anonymous",
    action: "auth.scope_denied",
    targetType: "scope",
    targetId: scope,
    ip: req.ip,
    meta: { clientRef: req.authedClient?.clientRef ?? null },
  });
  return reply.code(403).send({
    error: {
      code: "SCOPE_DENIED",
      message: `scope ${scope} required`,
      requestId: req.requestId ?? null,
    },
  });
}
