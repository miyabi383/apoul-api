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

beforeAll(async () => {
  execSync("pnpm db:deploy", { stdio: "inherit", env: process.env, cwd: REPO_ROOT });
  mock = await startMockBilling();
  const billingBase = `http://127.0.0.1:${mock.port}/mock/billing`;
  process.env.BILLING_BASE_URL = billingBase;
  process.env.ALLOW_LOCAL_DISPATCH = "true";

  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE job_attempts, jobs, inbound_events, audit_logs, id_mappings, transform_rules, routes, api_keys, api_clients, progress_items, health_check_runs, health_check_targets, operation_logs, idempotency_records, systems, users RESTART IDENTITY CASCADE`,
  );
  process.env.SEED_BILLING_MAPPING = "true";
  execSync("pnpm seed", { stdio: "inherit", env: process.env, cwd: REPO_ROOT });

  await prisma.system.update({
    where: { code: "billing" },
    data: { baseUrl: billingBase },
  });

  const contract = await prisma.system.findUniqueOrThrow({ where: { code: "contract" } });
  const client = await prisma.apiClient.create({
    data: { ref: genRef("cli"), systemId: contract.id, name: "worker-test", scopes: ["events:write"], status: "active" },
  });
  const issued = await generateApiKey("test");
  await prisma.apiKey.create({
    data: { ref: genRef("key"), clientId: client.id, keyHash: issued.keyHash, keyPrefix: issued.keyPrefix },
  });
  contractKey = issued.plaintext;
});

afterAll(async () => {
  await mock?.close();
  await prisma.$disconnect();
});

describe("APOUL worker", () => {
  it("W1 POST /v1/events 直後は pending、drain 後 success", async () => {
    const app = buildApp();
    const body = approvedEvent({ idempotencyKey: "w1-key" });
    const res = await app.inject({
      method: "POST",
      url: "/v1/events",
      headers: {
        authorization: `Bearer ${contractKey}`,
        "content-type": "application/json",
        "idempotency-key": body.idempotencyKey,
      },
      payload: JSON.stringify(body),
    });
    expect(res.statusCode).toBe(202);

    const jobRef = res.json().createdJobs[0].jobId as string;
    const pending = await prisma.job.findUniqueOrThrow({ where: { ref: jobRef } });
    expect(pending.status).toBe("pending");

    await drainAllJobs();
    const done = await prisma.job.findUniqueOrThrow({ where: { ref: jobRef } });
    expect(done.status).toBe("success");
    expect(mock.dispatches.some((d) => d.key === done.destinationKey)).toBe(true);
  });
});
