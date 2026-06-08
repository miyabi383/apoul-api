// src/server/services/processJob.ts

import { prisma } from "../db";
import { genRef } from "../lib/ids";
import { dispatchOutbound } from "../adapters/outbound";
import { applyIdMappings } from "../idmap/resolve";
import { applyTransform, parseMapping } from "../transform/engine";
import { writeAudit } from "./audit";

const ID_MAP_FIELDS = [{ field: "customerId", entityType: "customer" }];

export async function processJob(jobId: bigint, actorLabel = "system:worker") {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      route: { include: { targetSystem: true, transformRules: { where: { enabled: true }, orderBy: { version: "desc" }, take: 1 } } },
      inboundEvent: { include: { sourceSystem: true } },
    },
  });
  if (!job || job.status === "success" || job.status === "dead") return job;
  if (job.status === "processing") return job;
  if (job.status === "retrying" && job.nextRetryAt && job.nextRetryAt > new Date()) return job;

  const attemptNo = job.attemptCount + 1;
  const claimed = await prisma.job.updateMany({
    where: { id: jobId, status: { in: ["pending", "retrying"] } },
    data: { status: "processing", attemptCount: attemptNo },
  });
  if (claimed.count === 0) {
    return prisma.job.findUnique({ where: { id: jobId } });
  }

  const rule = job.route.transformRules[0];
  const mapping = parseMapping(rule?.mapping);
  const transform = applyTransform(job.inboundEvent.payload, mapping);

  if (!transform.ok) {
    await finalizeAttempt(jobId, attemptNo, {
      status: "dead",
      errorCode: transform.code,
      errorMsg: transform.message,
      requestBody: null,
      responseCode: null,
      responseBody: null,
    });
    return prisma.job.findUnique({ where: { id: jobId } });
  }

  const mapped = await applyIdMappings(
    job.inboundEvent.sourceSystemId,
    job.route.targetSystem.code,
    transform.data,
    ID_MAP_FIELDS,
  );

  if (!mapped.ok) {
    await finalizeAttempt(jobId, attemptNo, {
      status: "retrying",
      errorCode: mapped.code,
      errorMsg: mapped.message,
      requestBody: transform.data,
      responseCode: null,
      responseBody: null,
    });
    return prisma.job.findUnique({ where: { id: jobId } });
  }

  const baseUrl = job.route.targetSystem.baseUrl ?? process.env.BILLING_BASE_URL ?? "";
  if (!baseUrl) {
    await finalizeAttempt(jobId, attemptNo, {
      status: "retrying",
      errorCode: "NO_TARGET_URL",
      errorMsg: "target system baseUrl not configured",
      requestBody: mapped.data,
      responseCode: null,
      responseBody: null,
    });
    return prisma.job.findUnique({ where: { id: jobId } });
  }

  const started = Date.now();
  const dispatch = await dispatchOutbound({
    baseUrl,
    path: job.route.destinationPath,
    body: mapped.data,
    idempotencyKey: job.destinationKey,
  });
  const durationMs = Date.now() - started;

  if (dispatch.ok) {
    await finalizeAttempt(jobId, attemptNo, {
      status: "success",
      errorCode: null,
      errorMsg: null,
      requestBody: mapped.data,
      responseCode: dispatch.statusCode,
      responseBody: dispatch.body,
      transformedBody: mapped.data,
    });
    await writeAudit({
      actorLabel,
      action: "job.success",
      targetType: "job",
      targetId: job.ref,
      meta: { destinationKey: job.destinationKey },
    });
  } else if (dispatch.errorCode === "MAPPING_PENDING") {
    await finalizeAttempt(jobId, attemptNo, {
      status: "retrying",
      errorCode: dispatch.errorCode,
      errorMsg: dispatch.errorMsg ?? null,
      requestBody: mapped.data,
      responseCode: dispatch.statusCode,
      responseBody: dispatch.body,
    });
  } else if (dispatch.errorCode === "SSRF_BLOCKED") {
    await finalizeAttempt(jobId, attemptNo, {
      status: "retrying",
      errorCode: dispatch.errorCode,
      errorMsg: dispatch.errorMsg ?? null,
      requestBody: mapped.data,
      responseCode: null,
      responseBody: null,
    });
  } else {
    const isMapping = dispatch.errorCode === "MAPPING_PENDING";
    await finalizeAttempt(jobId, attemptNo, {
      status: isMapping ? "retrying" : "fail",
      errorCode: dispatch.errorCode ?? "DISPATCH_FAILED",
      errorMsg: dispatch.errorMsg ?? null,
      requestBody: mapped.data,
      responseCode: dispatch.statusCode,
      responseBody: dispatch.body,
      transformedBody: mapped.data,
    });
  }

  return prisma.job.findUnique({ where: { id: jobId } });
}

async function finalizeAttempt(
  jobId: bigint,
  attemptNo: number,
  input: {
    status: "success" | "retrying" | "fail" | "dead";
    errorCode: string | null;
    errorMsg: string | null;
    requestBody: unknown;
    responseCode: number | null;
    responseBody: string | null;
    transformedBody?: unknown;
  },
) {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) return;

  await prisma.jobAttempt.create({
    data: {
      ref: genRef("att"),
      jobId,
      attemptNo,
      status: input.status,
      requestBody: input.requestBody as object | undefined,
      responseCode: input.responseCode,
      responseBody: input.responseBody,
      errorCode: input.errorCode,
      errorMsg: input.errorMsg,
    },
  });

  await prisma.job.update({
    where: { id: jobId },
    data: {
      status: input.status,
      lastErrorCode: input.errorCode,
      lastErrorMsg: input.errorMsg,
      transformedBody: (input.transformedBody ?? input.requestBody) as object | undefined,
      completedAt: input.status === "success" ? new Date() : null,
      nextRetryAt: input.status === "retrying" ? new Date(Date.now() + 60_000) : null,
    },
  });
}

export async function retryJob(jobRef: string, actorLabel: string) {
  const job = await prisma.job.findUnique({ where: { ref: jobRef } });
  if (!job) return null;
  await writeAudit({ actorLabel, action: "job.retry", targetType: "job", targetId: jobRef });
  await prisma.job.update({
    where: { id: job.id },
    data: { nextRetryAt: null },
  });
  return processJob(job.id, actorLabel);
}

export async function deadJob(jobRef: string, actorLabel: string) {
  const job = await prisma.job.findUnique({ where: { ref: jobRef } });
  if (!job) return null;
  await prisma.job.update({ where: { id: job.id }, data: { status: "dead", completedAt: new Date() } });
  await writeAudit({ actorLabel, action: "job.dead", targetType: "job", targetId: jobRef });
  return prisma.job.findUnique({ where: { id: job.id } });
}
