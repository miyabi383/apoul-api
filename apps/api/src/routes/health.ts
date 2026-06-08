// src/server/routes/health.ts

import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../db";
import { requireScope } from "../auth/scope";
import { genRef } from "../lib/ids";

export async function healthCheckRoutes(app: FastifyInstance) {
  app.get("/v1/health-checks", { preHandler: requireScope("health:read") }, async (_req, reply) => {
    const targets = await prisma.healthCheckTarget.findMany({ where: { enabled: true }, orderBy: { code: "asc" } });
    return reply.send({
      items: targets.map((t) => ({ id: t.ref, code: t.code, name: t.name, url: t.url })),
    });
  });

  app.post("/v1/health-checks/run", { preHandler: requireScope("health:run") }, async (req, reply) => {
    const code = (req.body as { code?: string } | undefined)?.code;
    const targets = await prisma.healthCheckTarget.findMany({
      where: { enabled: true, ...(code ? { code } : {}) },
    });
    const results = [];
    for (const t of targets) {
      const started = Date.now();
      let ok = false;
      let statusCode: number | null = null;
      let errorMessage: string | null = null;
      try {
        const res = await fetch(t.url, { method: "GET" });
        statusCode = res.status;
        ok = res.ok;
      } catch (e) {
        errorMessage = e instanceof Error ? e.message : "fetch failed";
      }
      const run = await prisma.healthCheckRun.create({
        data: {
          ref: genRef("hcr"),
          targetId: t.id,
          ok,
          statusCode,
          latencyMs: Date.now() - started,
          errorMessage,
        },
      });
      results.push({ target: t.code, ok, statusCode, runId: run.ref });
    }
    return reply.send({ results });
  });
}
