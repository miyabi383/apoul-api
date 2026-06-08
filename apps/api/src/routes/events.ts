import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { requireScope } from "../auth/scope";
import { registerEventsRateLimit } from "../plugins/rateLimit";
import { ingestEvent } from "../services/ingest";
import { EnvelopeSchema } from "../validation/envelope";

export async function eventsRoutes(app: FastifyInstance) {
  await registerEventsRateLimit(app);

  app.post(
    "/v1/events",
    {
      schema: {
        tags: ["events"],
        summary: "イベント受信（Job 作成、Worker が非同期配送）",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["eventType", "sourceSystem", "resourceType", "resourceId", "occurredAt", "idempotencyKey", "payload"],
          properties: {
            eventType: { type: "string" },
            sourceSystem: { type: "string" },
            resourceType: { type: "string" },
            resourceId: { type: "string" },
            occurredAt: { type: "string", format: "date-time" },
            idempotencyKey: { type: "string" },
            payload: { type: "object", additionalProperties: true },
          },
        },
        response: {
          202: {
            type: "object",
            properties: {
              createdJobs: {
                type: "array",
                items: { type: "object", properties: { jobId: { type: "string" } } },
              },
            },
          },
        },
      },
      preHandler: requireScope("events:write"),
      config: {
        rateLimit: {
          max: Number(process.env.EVENTS_RATE_LIMIT_MAX ?? 120),
          timeWindow: Number(process.env.EVENTS_RATE_LIMIT_WINDOW_MS ?? 60_000),
        },
      },
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const parsed = EnvelopeSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send(err("VALIDATION_FAILED", "invalid envelope", req, parsed.error.issues));
      }

      const envelope = parsed.data;
      if (envelope.sourceSystem !== req.authedClient?.systemCode) {
        return reply.code(403).send(err("SOURCE_MISMATCH", "sourceSystem does not match api key system", req));
      }

      const headerKey = req.headers["idempotency-key"];
      if (typeof headerKey === "string" && headerKey !== envelope.idempotencyKey) {
        return reply.code(400).send(err("VALIDATION_FAILED", "idempotency-key header mismatch", req));
      }

      const result = await ingestEvent(envelope, req.authedClient!.systemCode);
      if ("code" in result) {
        return reply.code(result.status).send(err(result.code, result.message, req));
      }
      return reply.code(result.status).send(result.body);
    },
  );
}

function err(code: string, message: string, req: FastifyRequest, details?: unknown) {
  return { error: { code, message, requestId: req.requestId ?? null, details } };
}
