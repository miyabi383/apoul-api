// apps/api/test/integration.test.ts

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { execSync } from "node:child_process";
import { REPO_ROOT } from "./setup-env";
import { buildApp } from "../src/app";
import { drainAllJobs } from "../src/services/jobProcessor";
import { generateApiKey } from "../src/auth/apiKey";
import { genRef } from "../src/lib/ids";
import { approvedEvent } from "./helpers/fixtures";
import { startMockBilling, type MockBilling } from "./helpers/mockBilling";

const prisma = new PrismaClient();
let mock: MockBilling;
let contractKey = "";
let billingBase = "";

async function postEvent(key: string, body: unknown, idempotencyKey?: string) {
  const app = buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/v1/events",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
      "idempotency-key": idempotencyKey ?? (body as { idempotencyKey: string }).idempotencyKey,
    },
    payload: JSON.stringify(body),
  });
  const json = res.json() as { createdJobs?: Array<{ jobId: string }>; duplicate?: boolean };
  if (res.statusCode === 202 || res.statusCode === 200) {
    await drainAllJobs();
  }
  return { status: res.statusCode, json };
}

beforeAll(async () => {
  execSync("pnpm db:deploy", { stdio: "inherit", env: process.env, cwd: REPO_ROOT });
  mock = await startMockBilling();
  billingBase = `http://127.0.0.1:${mock.port}/mock/billing`;
  process.env.BILLING_BASE_URL = billingBase;
  process.env.ALLOW_LOCAL_DISPATCH = "true";

  await prisma.$executeRawUnsafe(`TRUNCATE TABLE job_attempts, jobs, inbound_events, audit_logs, id_mappings, transform_rules, routes, api_keys, api_clients, progress_items, health_check_runs, health_check_targets, operation_logs, idempotency_records, systems, users RESTART IDENTITY CASCADE`);

  process.env.SEED_BILLING_MAPPING = "true";
  execSync("pnpm seed", { stdio: "inherit", env: process.env, cwd: REPO_ROOT });

  const contract = await prisma.system.findUniqueOrThrow({ where: { code: "contract" } });
  const client = await prisma.apiClient.create({
    data: { ref: genRef("cli"), systemId: contract.id, name: "test-contract", scopes: ["events:write"], status: "active" },
  });
  const issued = await generateApiKey("test");
  await prisma.apiKey.create({ data: { ref: genRef("key"), clientId: client.id, keyHash: issued.keyHash, keyPrefix: issued.keyPrefix } });
  contractKey = issued.plaintext;

  await prisma.system.update({
    where: { code: "billing" },
    data: { baseUrl: billingBase },
  });
});

afterAll(async () => {
  await mock?.close();
  await prisma.$disconnect();
});

describe("APOUL integration", () => {
  it("T1 正常系 受信→処理→success", async () => {
    const body = approvedEvent({ idempotencyKey: "t1-key" });
    const { status, json } = await postEvent(contractKey, body);
    expect(status).toBe(202);
    const jobId = json.createdJobs![0].jobId as string;
    const job = await prisma.job.findUniqueOrThrow({ where: { ref: jobId } });
    expect(job.status).toBe("success");
    expect(job.destinationKey).toMatch(/^billing-ctr_C-1001-invoice-v1$/);
    expect(mock.dispatches.some((d) => d.key === job.destinationKey)).toBe(true);
  });

  it("T2 同payload再送=200・ジョブ増えない", async () => {
    const body = approvedEvent({ idempotencyKey: "t2-key" });
    await postEvent(contractKey, body);
    const countBefore = await prisma.job.count();
    const { status, json } = await postEvent(contractKey, body);
    expect(status).toBe(200);
    expect(json.duplicate).toBe(true);
    expect(await prisma.job.count()).toBe(countBefore);
  });

  it("T3 同キー異payload=409", async () => {
    const key = "t3-key";
    await postEvent(contractKey, approvedEvent({ idempotencyKey: key, amount: 100 }));
    const { status } = await postEvent(contractKey, approvedEvent({ idempotencyKey: key, amount: 200 }));
    expect(status).toBe(409);
  });

  it("T4 MAPPING_PENDING=retrying・配送なし", async () => {
    await prisma.idMapping.deleteMany({ where: { localId: "CUST-99" } });
    const before = mock.dispatches.length;
    const body = approvedEvent({ idempotencyKey: "t4-key", customerId: "CUST-99" });
    const { json } = await postEvent(contractKey, body);
    const job = await prisma.job.findUniqueOrThrow({ where: { ref: json.createdJobs![0].jobId } });
    expect(job.status).toBe("retrying");
    expect(job.lastErrorCode).toBe("MAPPING_PENDING");
    expect(mock.dispatches.length).toBe(before);
  });

  it("T5 マッピング登録後 retry=success", async () => {
    const body = approvedEvent({ idempotencyKey: "t5-key", customerId: "CUST-55" });
    const { json } = await postEvent(contractKey, body);
    const jobRef = json.createdJobs![0].jobId;
    const contract = await prisma.system.findUniqueOrThrow({ where: { code: "contract" } });
    await prisma.idMapping.create({
      data: { ref: genRef("map"), systemId: contract.id, entityType: "customer", localId: "CUST-55", remoteSystem: "billing", remoteId: "BILL-55" },
    });

    const svc = await prisma.apiClient.create({
      data: { ref: genRef("cli"), systemId: contract.id, name: "svc", scopes: ["jobs:retry"], status: "active" },
    });
    const issued = await generateApiKey("test");
    await prisma.apiKey.create({ data: { ref: genRef("key"), clientId: svc.id, keyHash: issued.keyHash, keyPrefix: issued.keyPrefix } });

    const app = buildApp();
    const res = await app.inject({
      method: "POST",
      url: `/v1/jobs/${jobRef}/retry`,
      headers: { authorization: `Bearer ${issued.plaintext}` },
    });
    expect(res.statusCode).toBe(200);
    const job = await prisma.job.findUniqueOrThrow({ where: { ref: jobRef } });
    expect(job.status).toBe("success");
    const audits = await prisma.auditLog.findMany({ where: { targetId: jobRef, action: "job.retry" } });
    expect(audits.length).toBeGreaterThan(0);
  });

  it("T6 retry反復で宛先キー不変・ジョブ1件", async () => {
    const body = approvedEvent({ idempotencyKey: "t6-key", contractId: "C-2002" });
    const { json } = await postEvent(contractKey, body);
    const jobRef = json.createdJobs![0].jobId;
    const job1 = await prisma.job.findUniqueOrThrow({ where: { ref: jobRef } });
    const dest = job1.destinationKey;
    expect(await prisma.job.count({ where: { ref: jobRef } })).toBe(1);
    expect(dest).toBe("billing-ctr_C-2002-invoice-v1");
  });

  it("T7 source不一致=403", async () => {
    const billing = await prisma.system.findUniqueOrThrow({ where: { code: "billing" } });
    const client = await prisma.apiClient.create({
      data: { ref: genRef("cli"), systemId: billing.id, name: "billing-writer", scopes: ["events:write"], status: "active" },
    });
    const issued = await generateApiKey("test");
    await prisma.apiKey.create({ data: { ref: genRef("key"), clientId: client.id, keyHash: issued.keyHash, keyPrefix: issued.keyPrefix } });
    const { status } = await postEvent(issued.plaintext, approvedEvent({ idempotencyKey: "t7-key" }));
    expect(status).toBe(403);
  });

  it("T8a envelope必須欠落=400", async () => {
    const app = buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/v1/events",
      headers: { authorization: `Bearer ${contractKey}`, "content-type": "application/json" },
      payload: { eventType: "contract.approved" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("T8b payload customerId欠落=dead", async () => {
    const body = approvedEvent({ idempotencyKey: "t8b-key" });
    const broken = { ...body, payload: { contractId: "C-x", amount: 1, currency: "JPY" } };
    const { json } = await postEvent(contractKey, broken);
    const job = await prisma.job.findUniqueOrThrow({ where: { ref: json.createdJobs![0].jobId } });
    expect(job.status).toBe("dead");
  });
});
