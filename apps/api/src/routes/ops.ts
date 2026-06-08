// src/server/routes/ops.ts

import type { FastifyInstance } from "fastify";
import { prisma } from "../db";
import { requireScope } from "../auth/scope";

export async function opsRoutes(app: FastifyInstance) {
  app.get("/v1/ops/summary", { preHandler: requireScope("ops:read") }, async (_req, reply) => {
    const [pending, retrying, dead, success] = await Promise.all([
      prisma.job.count({ where: { status: "pending" } }),
      prisma.job.count({ where: { status: "retrying" } }),
      prisma.job.count({ where: { status: "dead" } }),
      prisma.job.count({ where: { status: "success" } }),
    ]);
    return reply.send({ jobs: { pending, retrying, dead, success } });
  });
}
