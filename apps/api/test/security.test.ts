// apps/api/test/security.test.ts

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { execSync } from "node:child_process";
import { assertAuthNotDisabledInProduction } from "@apoul/shared";
import { REPO_ROOT } from "./setup-env";
import { buildApp } from "../src/app";
import { generateApiKey } from "../src/auth/apiKey";
import { genRef } from "../src/lib/ids";
import { approvedEvent } from "./helpers/fixtures";

const prisma = new PrismaClient();
let contractKey = "";
let readOnlyKey = "";

beforeAll(async () => {
  execSync("pnpm db:deploy", { stdio: "inherit", env: process.env, cwd: REPO_ROOT });

  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE job_attempts, jobs, inbound_events, audit_logs, id_mappings, transform_rules, routes, api_keys, api_clients, progress_items, health_check_runs, health_check_targets, operation_logs, idempotency_records, systems, users RESTART IDENTITY CASCADE`,
  );

  process.env.SEED_BILLING_MAPPING = "true";
  execSync("pnpm seed", { stdio: "inherit", env: process.env, cwd: REPO_ROOT });

  const contract = await prisma.system.findUniqueOrThrow({ where: { code: "contract" } });

  const writer = await prisma.apiClient.create({
    data: { ref: genRef("cli"), systemId: contract.id, name: "sec-writer", scopes: ["events:write"], status: "active" },
  });
  const writerKey = await generateApiKey("test");
  await prisma.apiKey.create({
    data: { ref: genRef("key"), clientId: writer.id, keyHash: writerKey.keyHash, keyPrefix: writerKey.keyPrefix },
  });
  contractKey = writerKey.plaintext;

  const reader = await prisma.apiClient.create({
    data: { ref: genRef("cli"), systemId: contract.id, name: "sec-reader", scopes: ["jobs:read"], status: "active" },
  });
  const readerIssued = await generateApiKey("test");
  await prisma.apiKey.create({
    data: { ref: genRef("key"), clientId: reader.id, keyHash: readerIssued.keyHash, keyPrefix: readerIssued.keyPrefix },
  });
  readOnlyKey = readerIssued.plaintext;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("APOUL env security", () => {
  it("S1 production + AUTH_DISABLED=true は起動拒否", () => {
    expect(() => assertAuthNotDisabledInProduction("production", "true")).toThrow(/AUTH_DISABLED/);
    expect(() => assertAuthNotDisabledInProduction("development", "true")).not.toThrow();
  });
});

describe("APOUL security", () => {
  it("S2 scope不足=403 + 監査", async () => {
    const app = buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/v1/events",
      headers: {
        authorization: `Bearer ${readOnlyKey}`,
        "content-type": "application/json",
        "idempotency-key": "s2-key",
      },
      payload: JSON.stringify(approvedEvent({ idempotencyKey: "s2-key" })),
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().error.code).toBe("SCOPE_DENIED");

    const audits = await prisma.auditLog.findMany({ where: { action: "auth.scope_denied" } });
    expect(audits.length).toBeGreaterThan(0);
  });

  it("S3 失効キー=401 + 監査", async () => {
    const contract = await prisma.system.findUniqueOrThrow({ where: { code: "contract" } });
    const client = await prisma.apiClient.create({
      data: { ref: genRef("cli"), systemId: contract.id, name: "sec-revoked", scopes: ["events:write"], status: "active" },
    });
    const issued = await generateApiKey("test");
    const key = await prisma.apiKey.create({
      data: { ref: genRef("key"), clientId: client.id, keyHash: issued.keyHash, keyPrefix: issued.keyPrefix },
    });
    await prisma.apiKey.update({ where: { id: key.id }, data: { revokedAt: new Date() } });

    const app = buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/v1/events",
      headers: {
        authorization: `Bearer ${issued.plaintext}`,
        "content-type": "application/json",
        "idempotency-key": "s3-key",
      },
      payload: JSON.stringify(approvedEvent({ idempotencyKey: "s3-key" })),
    });
    expect(res.statusCode).toBe(401);

    const audits = await prisma.auditLog.findMany({ where: { action: "auth.apikey_invalid" } });
    expect(audits.length).toBeGreaterThan(0);
  });

  it("S4 IP allowlist外=403 + 監査", async () => {
    const contract = await prisma.system.findUniqueOrThrow({ where: { code: "contract" } });
    const client = await prisma.apiClient.create({
      data: {
        ref: genRef("cli"),
        systemId: contract.id,
        name: "sec-ip",
        scopes: ["events:write"],
        status: "active",
        ipAllowlist: ["10.255.255.1"],
      },
    });
    const issued = await generateApiKey("test");
    await prisma.apiKey.create({
      data: { ref: genRef("key"), clientId: client.id, keyHash: issued.keyHash, keyPrefix: issued.keyPrefix },
    });

    const app = buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/v1/events",
      headers: {
        authorization: `Bearer ${issued.plaintext}`,
        "content-type": "application/json",
        "idempotency-key": "s4-key",
      },
      payload: JSON.stringify(approvedEvent({ idempotencyKey: "s4-key" })),
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().error.code).toBe("IP_DENIED");

    const audits = await prisma.auditLog.findMany({ where: { action: "auth.ip_denied" } });
    expect(audits.length).toBeGreaterThan(0);
  });

  it("S5 login rate limit=429", async () => {
    process.env.LOGIN_RATE_LIMIT_MAX = "2";
    process.env.LOGIN_RATE_LIMIT_WINDOW_MS = "60000";

    const app = buildApp();
    const payload = { email: "nobody@example.com", password: "wrong" };

    const r1 = await app.inject({ method: "POST", url: "/v1/auth/login", payload });
    const r2 = await app.inject({ method: "POST", url: "/v1/auth/login", payload });
    const r3 = await app.inject({ method: "POST", url: "/v1/auth/login", payload });

    expect(r1.statusCode).toBe(401);
    expect(r2.statusCode).toBe(401);
    expect(r3.statusCode).toBe(429);
    expect(r3.json().error.code).toBe("RATE_LIMITED");

    delete process.env.LOGIN_RATE_LIMIT_MAX;
    delete process.env.LOGIN_RATE_LIMIT_WINDOW_MS;
  });

  it("S6 login失敗=監査", async () => {
    const app = buildApp();
    await app.inject({
      method: "POST",
      url: "/v1/auth/login",
      payload: { email: "fail@example.com", password: "nope" },
    });

    const audits = await prisma.auditLog.findMany({ where: { action: "auth.login_failed", targetId: "fail@example.com" } });
    expect(audits.length).toBeGreaterThan(0);
  });
});
