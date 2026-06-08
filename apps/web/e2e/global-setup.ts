import { execSync, spawn, type ChildProcess } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { syncDevToken } from "../../../scripts/syncDevToken.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const WEB_ROOT = resolve(ROOT, "apps/web");
const API_ROOT = resolve(ROOT, "apps/api");
const STATE_FILE = resolve(WEB_ROOT, ".e2e-state.json");

async function waitForUrl(url: string, timeoutMs = 120_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function spawnDetached(cwd: string, command: string, args: string[], env: NodeJS.ProcessEnv): ChildProcess {
  return spawn(command, args, {
    cwd,
    env,
    stdio: "ignore",
    detached: true,
    shell: true,
  });
}

export default async function globalSetup() {
  const token = syncDevToken();

  if (process.env.PLAYWRIGHT_SKIP_WEBSERVER) {
    console.log(
      "[e2e] PLAYWRIGHT_SKIP_WEBSERVER=1 — .env / apps/web/.env.local を更新済み。web:dev を再起動してからテストしてください。",
    );
    return;
  }

  const webEnv = { ...process.env, APOUL_SERVICE_TOKEN: token };

  const state: { apiPid?: number; webPid?: number; startedApi?: boolean; startedWeb?: boolean } = {};

  let apiRunning = false;
  try {
    const res = await fetch("http://localhost:4100/health");
    apiRunning = res.ok;
  } catch {
    apiRunning = false;
  }

  if (!apiRunning) {
    const api = spawnDetached(API_ROOT, "pnpm", ["dev"], webEnv);
    api.unref();
    state.apiPid = api.pid;
    state.startedApi = true;
    await waitForUrl("http://localhost:4100/health");
  }

  const web = spawnDetached(WEB_ROOT, "node", ["./e2e/run-dev.mjs"], webEnv);
  web.unref();
  state.webPid = web.pid;
  state.startedWeb = true;
  await waitForUrl("http://localhost:3000");

  writeFileSync(STATE_FILE, JSON.stringify(state), "utf8");
}
