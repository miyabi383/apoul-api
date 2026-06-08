// src/server/routes/jobs.ts

import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../db";
import { requireScope } from "../auth/scope";
import { deadJob, retryJob } from "../services/processJob";

export async function jobsRoutes(app: FastifyInstance) {
  app.get("/v1/jobs", {
    schema: {
      tags: ["jobs"],
      summary: "ジョブ一覧",
      security: [{ bearerAuth: [] }],
      querystring: {
        type: "object",
        properties: { status: { type: "string" } },
      },
    },
    preHandler: requireScope("jobs:read"),
  }, async (req, reply) => {
    const q = req.query as Record<string, string | undefined>;
    const jobs = await prisma.job.findMany({
      where: q.status ? { status: q.status as never } : undefined,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { inboundEvent: { include: { sourceSystem: true } } },
    });
    return reply.send({
      items: jobs.map((j) => ({
        id: j.ref,
        status: j.status,
        eventType: j.inboundEvent.eventType,
        sourceSystem: j.inboundEvent.sourceSystem.code,
        destinationKey: j.destinationKey,
        attemptCount: j.attemptCount,
        lastErrorCode: j.lastErrorCode,
        createdAt: j.createdAt.toISOString(),
        updatedAt: j.updatedAt.toISOString(),
      })),
    });
  });

  app.get("/v1/jobs/:id", { preHandler: requireScope("jobs:read") }, async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const job = await prisma.job.findUnique({
      where: { ref: id },
      include: {
        inboundEvent: { include: { sourceSystem: true } },
        attempts: { orderBy: { attemptNo: "asc" } },
      },
    });
    if (!job) return reply.code(404).send(err("NOT_FOUND", "job not found", req));
    return reply.send({
      id: job.ref,
      status: job.status,
      eventType: job.inboundEvent.eventType,
      sourceSystem: job.inboundEvent.sourceSystem.code,
      resourceId: job.inboundEvent.resourceId,
      destinationKey: job.destinationKey,
      attemptCount: job.attemptCount,
      lastErrorCode: job.lastErrorCode,
      payload: job.inboundEvent.payload,
      transformedBody: job.transformedBody,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
      attempts: job.attempts.map((a) => ({
        attemptNo: a.attemptNo,
        status: a.status,
        errorCode: a.errorCode,
        errorMsg: a.errorMsg,
        responseCode: a.responseCode,
        createdAt: a.createdAt.toISOString(),
      })),
    });
  });

  app.post("/v1/jobs/:id/retry", { preHandler: requireScope("jobs:retry") }, async (req, reply) => {
    const updated = await retryJob((req.params as { id: string }).id, actor(req));
    if (!updated) return reply.code(404).send(err("NOT_FOUND", "job not found", req));
    return reply.send({ id: updated.ref, status: updated.status });
  });

  app.post("/v1/jobs/:id/dead", { preHandler: requireScope("jobs:dead") }, async (req, reply) => {
    const updated = await deadJob((req.params as { id: string }).id, actor(req));
    if (!updated) return reply.code(404).send(err("NOT_FOUND", "job not found", req));
    return reply.send({ id: updated.ref, status: updated.status });
  });
}

function actor(req: FastifyRequest) {
  return `apikey:${req.authedClient?.systemCode ?? "unknown"}`;
}
function err(code: string, message: string, req: FastifyRequest, details?: unknown) {
  return { error: { code, message, requestId: req.requestId ?? null, details } };
}
