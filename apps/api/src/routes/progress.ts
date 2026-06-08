// src/server/routes/progress.ts

import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { requireScope } from "../auth/scope";
import { listProgress, updateProgress } from "../services/progress";

const PatchSchema = z.object({
  status: z.enum(["not_started", "in_progress", "done", "blocked"]).optional(),
  percent: z.number().int().min(0).max(100).optional(),
  note: z.string().nullable().optional(),
});

export async function progressRoutes(app: FastifyInstance) {
  app.get("/v1/progress", { preHandler: requireScope("progress:read") }, async (req, reply) => {
    const q = req.query as Record<string, string | undefined>;
    const items = await listProgress(q.projectCode);
    return reply.send({ items });
  });

  app.patch("/v1/progress/:id", { preHandler: requireScope("progress:write") }, async (req, reply) => {
    const parsed = PatchSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: { code: "VALIDATION_FAILED", message: "invalid body", requestId: req.requestId ?? null } });
    }
    const updated = await updateProgress((req.params as { id: string }).id, parsed.data);
    if (!updated) return reply.code(404).send({ error: { code: "NOT_FOUND", message: "item not found", requestId: req.requestId ?? null } });
    return reply.send(updated);
  });
}
