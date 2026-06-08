/**
 * 本番インフラを API キーだけで一括セットアップ
 *
 * 必要なキー（各ダッシュボードで 1 回コピー）:
 *   NEON_API_KEY   → https://console.neon.tech/app/settings/api-keys
 *   DATABASE_URL   → 上記の代わりに Neon Console で手動作成した接続文字列
 *   RENDER_API_KEY → https://dashboard.render.com/u/settings#api-keys
 *
 * 使い方:
 *   NEON_API_KEY=xxx RENDER_API_KEY=yyy pnpm provision:prod
 *   DATABASE_URL=postgresql://... RENDER_API_KEY=yyy pnpm provision:prod
 *
 * ローカルから Neon に migrate/seed するため Render Shell は不要。
 */
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { syncDevToken } from "./syncDevToken.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const NEON_KEY = process.env.NEON_API_KEY?.trim();
const DATABASE_URL_IN = process.env.DATABASE_URL?.trim();
const RENDER_KEY = process.env.RENDER_API_KEY?.trim();
const GITHUB_REPO = process.env.GITHUB_REPO?.trim() ?? "https://github.com/miyabi383/apoul-api";
const BRANCH = process.env.GITHUB_BRANCH?.trim() ?? "master";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.trim() ?? "admin@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD?.trim() ?? "ChangeMe-strong-passw0rd";
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID?.trim() ?? "prj_B1f6irjNshN50i8VnplJ3FACjBOE";
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID?.trim() ?? "team_iqVzylMafuF54KWxEoDZofml";

function vercelToken(): string {
  const authPath = `${process.env.APPDATA}/com.vercel.cli/Data/auth.json`;
  return JSON.parse(readFileSync(authPath, "utf8")).token as string;
}

function requireKeys() {
  const missing: string[] = [];
  if (!NEON_KEY && !DATABASE_URL_IN) missing.push("NEON_API_KEY または DATABASE_URL");
  if (!RENDER_KEY) missing.push("RENDER_API_KEY");
  if (missing.length) {
    console.error("\n❌ 以下の環境変数が必要です:\n");
    for (const k of missing) console.error(`   export ${k}=<your-key>`);
    console.error("\nNeon（どちらか）:");
    console.error("  API キー: https://console.neon.tech/app/settings/api-keys");
    console.error("  または Console で New Project → Connection string を DATABASE_URL に");
    console.error("  Render:   https://dashboard.render.com/u/settings#api-keys");
    console.error("\n例:");
    console.error("  DATABASE_URL=postgresql://... RENDER_API_KEY=yyy pnpm provision:prod\n");
    process.exit(1);
  }
}

async function neonFetch(path: string, init?: RequestInit) {
  const res = await fetch(`https://console.neon.tech/api/v2${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${NEON_KEY}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`Neon API ${path} → ${res.status}: ${body}`);
  return body ? JSON.parse(body) : null;
}

async function renderFetch(path: string, init?: RequestInit) {
  const res = await fetch(`https://api.render.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${RENDER_KEY}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`Render API ${path} → ${res.status}: ${body}`);
  return body ? JSON.parse(body) : null;
}

type RenderService = {
  id: string;
  name: string;
  serviceDetails?: { url?: string };
};

function unwrapRenderServices(raw: unknown): RenderService[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (item && typeof item === "object" && "service" in item) {
        return (item as { service: RenderService }).service;
      }
      return item as RenderService;
    })
    .filter((s) => s?.id);
}

async function getRenderOwnerId(): Promise<string> {
  const raw = (await renderFetch("/owners?limit=1")) as
    | { owner: { id: string } }[]
    | { id: string }[];
  const first = raw[0];
  const ownerId =
    first && "owner" in first ? first.owner.id : first && "id" in first ? first.id : undefined;
  if (!ownerId) throw new Error("Render owner が見つかりません");
  return ownerId;
}

async function ensureNeonDatabase(): Promise<string> {
  console.log("==> 1/5 Neon PostgreSQL");
  if (DATABASE_URL_IN) {
    let url = DATABASE_URL_IN;
    if (!url.includes("sslmode=")) url += url.includes("?") ? "&sslmode=require" : "?sslmode=require";
    console.log("   手動指定の DATABASE_URL を使用");
    return url;
  }

  try {
    const projects = (await neonFetch("/projects")) as { projects: { id: string; name: string }[] };
    let project = projects.projects.find((p) => p.name === "apoul-api");
    if (!project) {
      const created = (await neonFetch("/projects", {
        method: "POST",
        body: JSON.stringify({
          project: { name: "apoul-api", region_id: "aws-ap-southeast-1" },
        }),
      })) as { project: { id: string } };
      project = { id: created.project.id, name: "apoul-api" };
      console.log("   プロジェクト作成:", project.id);
    } else {
      console.log("   既存プロジェクト使用:", project.id);
    }

    const conn = (await neonFetch(
      `/projects/${project.id}/connection_uri?database_name=neondb&role_name=neondb_owner`,
    )) as { uri: string };
    let url = conn.uri;
    if (!url.includes("sslmode=")) url += url.includes("?") ? "&sslmode=require" : "?sslmode=require";
    console.log("   DATABASE_URL 取得済み");
    return url;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("401")) {
      console.error("\n❌ Neon API キーが無効です（401）");
      console.error("   Account settings → API keys で新しいキーを作成してください。");
      console.error("   Personal Tokens ではなく、Organization / Account の API keys を試してください。");
      console.error("\n   または Neon Console で New Project → Connection string をコピーし:");
      console.error("   DATABASE_URL=postgresql://... RENDER_API_KEY=... pnpm provision:prod\n");
    }
    throw e;
  }
}

async function ensureRenderService(databaseUrl: string, serviceToken: string, sessionSecret: string) {
  console.log("==> 3/5 Render（API + Worker）");
  const ownerId = await getRenderOwnerId();

  const services = unwrapRenderServices(await renderFetch(`/services?ownerId=${ownerId}&limit=50`));

  let service = services.find((s) => s.name === "apoul-api");
  const envVars = [
    { key: "NODE_ENV", value: "production" },
    { key: "AUTH_DISABLED", value: "false" },
    { key: "ALLOW_LOCAL_DISPATCH", value: "false" },
    { key: "PORT", value: "4100" },
    { key: "WORKER_POLL_MS", value: "2000" },
    { key: "DATABASE_URL", value: databaseUrl },
    { key: "SESSION_SECRET", value: sessionSecret },
    { key: "APOUL_SERVICE_TOKEN", value: serviceToken },
    { key: "ADMIN_EMAIL", value: ADMIN_EMAIL },
    { key: "ADMIN_PASSWORD", value: ADMIN_PASSWORD },
    { key: "SEED_BILLING_MAPPING", value: "true" },
  ];

  if (!service) {
    const created = (await renderFetch("/services", {
      method: "POST",
      body: JSON.stringify({
        type: "web_service",
        name: "apoul-api",
        ownerId,
        repo: GITHUB_REPO,
        branch: BRANCH,
        autoDeploy: "yes",
        serviceDetails: {
          env: "docker",
          envSpecificDetails: { dockerfilePath: "./docker/Dockerfile.combined" },
          healthCheckPath: "/health",
          plan: "free",
          region: "singapore",
        },
        envVars,
      }),
    })) as { service?: RenderService; id?: string; serviceDetails?: { url?: string } };
    const createdService = created.service ?? created;
    service = {
      id: createdService.id,
      name: "apoul-api",
      serviceDetails: createdService.serviceDetails,
    };
    console.log("   サービス作成:", service.id);
  } else {
    for (const { key, value } of envVars) {
      await renderFetch(`/services/${service.id}/env-vars`, {
        method: "POST",
        body: JSON.stringify({ key, value }),
      }).catch(async () => {
        await renderFetch(`/services/${service.id}/env-vars/${encodeURIComponent(key)}`, {
          method: "PUT",
          body: JSON.stringify({ value }),
        });
      });
    }
    await renderFetch(`/services/${service.id}/deploys`, { method: "POST", body: "{}" });
    console.log("   既存サービス更新 + 再デプロイ:", service.id);
  }

  const detailRaw = (await renderFetch(`/services/${service.id}`)) as
    | { service?: RenderService }
    | RenderService;
  const detail = "service" in detailRaw && detailRaw.service ? detailRaw.service : detailRaw;
  const apiUrl = detail.serviceDetails?.url;
  if (!apiUrl) throw new Error("Render API URL を取得できませんでした");
  console.log("   API URL:", apiUrl);
  return apiUrl.replace(/\/$/, "");
}

async function waitForHealth(apiUrl: string, maxSec = 600) {
  console.log("   起動待ち（無料枠はコールドスタート 1〜3 分）...");
  const start = Date.now();
  while (Date.now() - start < maxSec * 1000) {
    try {
      const res = await fetch(`${apiUrl}/health`, { signal: AbortSignal.timeout(15000) });
      if (res.ok) {
        console.log("   /health OK");
        return;
      }
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 15000));
  }
  console.warn("   ⚠ ヘルスチェックタイムアウト — Render ダッシュボードでログを確認してください");
}

async function setVercelEnv(apiUrl: string, serviceToken: string, sessionSecret: string) {
  console.log("==> 4/5 Vercel 環境変数");
  const token = vercelToken();
  const pairs: { key: string; value: string }[] = [
    { key: "NODE_ENV", value: "production" },
    { key: "AUTH_DISABLED", value: "false" },
    { key: "APOUL_API_URL", value: apiUrl },
    { key: "APOUL_SERVICE_TOKEN", value: serviceToken },
    { key: "SESSION_SECRET", value: sessionSecret },
    { key: "ADMIN_EMAIL", value: ADMIN_EMAIL },
    { key: "ADMIN_PASSWORD", value: ADMIN_PASSWORD },
  ];

  for (const { key, value } of pairs) {
    const res = await fetch(
      `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/env?teamId=${VERCEL_TEAM_ID}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          key,
          value,
          type: "encrypted",
          target: ["production", "preview"],
        }),
      },
    );
    if (!res.ok) {
      const err = await res.text();
      if (err.includes("ENV_CONFLICT")) {
        const list = (await (
          await fetch(
            `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/env?teamId=${VERCEL_TEAM_ID}`,
            { headers: { Authorization: `Bearer ${token}` } },
          )
        ).json()) as { envs: { id: string; key: string }[] };
        const existing = list.envs.find((e) => e.key === key);
        if (existing) {
          await fetch(`https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/env/${existing.id}?teamId=${VERCEL_TEAM_ID}`, {
            method: "PATCH",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ value }),
          });
          continue;
        }
      }
      throw new Error(`Vercel env ${key}: ${err}`);
    }
  }
  console.log("   環境変数設定済み");
}

async function redeployVercel() {
  console.log("==> 5/5 Vercel 再デプロイ");
  execSync("npx vercel deploy --prod --yes", { cwd: ROOT, stdio: "inherit" });
}

async function main() {
  requireKeys();

  const databaseUrl = await ensureNeonDatabase();
  const sessionSecret =
    process.env.SESSION_SECRET?.trim() ??
    execSync("node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"", {
      encoding: "utf8",
    }).trim();

  console.log("==> 2/5 DB migrate + seed（ローカル → Neon）");
  const setupEnv = {
    ...process.env,
    DATABASE_URL: databaseUrl,
    ADMIN_EMAIL,
    ADMIN_PASSWORD,
    SESSION_SECRET: sessionSecret,
    SEED_BILLING_MAPPING: "true",
  };
  execSync("pnpm db:deploy", { cwd: ROOT, stdio: "inherit", env: setupEnv });
  execSync("pnpm seed", { cwd: ROOT, stdio: "inherit", env: setupEnv });
  Object.assign(process.env, setupEnv);
  const serviceToken = syncDevToken({ writeFiles: false, seed: false });

  const apiUrl = await ensureRenderService(databaseUrl, serviceToken, sessionSecret);
  await waitForHealth(apiUrl);
  await setVercelEnv(apiUrl, serviceToken, sessionSecret);
  await redeployVercel();

  console.log("\n=== 本番セットアップ完了 ===\n");
  console.log("管理画面:", "https://web-blond-nine-25.vercel.app/login");
  console.log("API:", `${apiUrl}/health`);
  console.log("Swagger:", `${apiUrl}/docs`);
  console.log("\nログイン:");
  console.log(`  Email:    ${ADMIN_EMAIL}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
