import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const WEB_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const STATE_FILE = resolve(WEB_ROOT, ".e2e-state.json");

function killPid(pid: number | undefined) {
  if (!pid) return;
  try {
    process.kill(pid);
  } catch {
    /* already stopped */
  }
}

export default async function globalTeardown() {
  if (process.env.PLAYWRIGHT_SKIP_WEBSERVER) return;
  if (!existsSync(STATE_FILE)) return;

  const state = JSON.parse(readFileSync(STATE_FILE, "utf8")) as {
    apiPid?: number;
    webPid?: number;
    startedApi?: boolean;
    startedWeb?: boolean;
  };

  if (state.startedWeb) killPid(state.webPid);
  if (state.startedApi) killPid(state.apiPid);

  for (const file of [STATE_FILE, resolve(WEB_ROOT, ".e2e-token")]) {
    try {
      unlinkSync(file);
    } catch {
      /* ignore */
    }
  }
}
