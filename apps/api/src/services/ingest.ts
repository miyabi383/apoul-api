// src/server/services/ingest.ts

import { prisma } from "../db";
import { genRef, hashPayload } from "../lib/ids";
import { renderTemplate } from "../lib/jsonpath";
import type { Envelope } from "../validation/envelope";
import { onJobsCreated } from "./jobService";

export type IngestResult =
  | { status: 202; body: { createdJobs: Array<{ jobId: string }>; duplicate?: false } }
  | { status: 200; body: { duplicate: true; createdJobs: Array<{ jobId: string }> } }
  | { status: 409; code: string; message: string };

export async function ingestEvent(envelope: Envelope, _authedSystemCode: string): Promise<IngestResult> {
  const payloadHash = hashPayload(envelope.payload);
  const existing = await prisma.inboundEvent.findUnique({ where: { idempotencyKey: envelope.idempotencyKey } });

  if (existing) {
    if (existing.payloadHash !== payloadHash) {
      return { status: 409, code: "IDEMPOTENCY_CONFLICT", message: "idempotency key reused with different payload" };
    }
    const jobs = await prisma.job.findMany({ where: { inboundEventId: existing.id }, select: { ref: true } });
    return { status: 200, body: { duplicate: true, createdJobs: jobs.map((j) => ({ jobId: j.ref })) } };
  }

  const sourceSystem = await prisma.system.findUnique({ where: { code: envelope.sourceSystem } });
  if (!sourceSystem) {
    return { status: 409, code: "SOURCE_NOT_FOUND", message: "source system not registered" };
  }

  const routes = await prisma.route.findMany({
    where: { sourceSystemId: sourceSystem.id, eventType: envelope.eventType, enabled: true },
    include: { targetSystem: true, transformRules: { where: { enabled: true }, orderBy: { version: "desc" }, take: 1 } },
  });

  const event = await prisma.inboundEvent.create({
    data: {
      ref: genRef("evt"),
      idempotencyKey: envelope.idempotencyKey,
      payloadHash,
      eventType: envelope.eventType,
      sourceSystemId: sourceSystem.id,
      resourceType: envelope.resourceType,
      resourceId: envelope.resourceId,
      occurredAt: new Date(envelope.occurredAt),
      payload: envelope.payload as object,
    },
  });

  const createdJobs: Array<{ jobId: string; id: bigint }> = [];
  for (const route of routes) {
    const contractId = (envelope.payload as Record<string, unknown>).contractId;
    const ctx: Record<string, string> = {
      contractId: String(contractId ?? envelope.resourceId),
      resourceId: envelope.resourceId,
    };
    const destinationKey = renderTemplate(route.destinationKeyTpl, ctx);

    const job = await prisma.job.create({
      data: {
        ref: genRef("job"),
        inboundEventId: event.id,
        routeId: route.id,
        status: "pending",
        destinationKey,
      },
    });
    createdJobs.push({ jobId: job.ref, id: job.id });
  }

  await onJobsCreated(createdJobs.map((j) => j.id));

  return {
    status: 202,
    body: { createdJobs: createdJobs.map((j) => ({ jobId: j.jobId })) },
  };
}
