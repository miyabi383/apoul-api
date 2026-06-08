import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const WEB_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TOKEN_FILE = resolve(WEB_ROOT, ".e2e-token");

const token =
  process.env.APOUL_SERVICE_TOKEN ??
  (existsSync(TOKEN_FILE) ? readFileSync(TOKEN_FILE, "utf8").trim() : "");

if (!token) {
  console.error("Missing APOUL_SERVICE_TOKEN for E2E web dev");
  process.exit(1);
}

const child = spawn("pnpm", ["exec", "next", "dev", "-p", "3000"], {
  cwd: WEB_ROOT,
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    APOUL_SERVICE_TOKEN: token,
    APOUL_API_URL: process.env.APOUL_API_URL ?? "http://localhost:4100",
    AUTH_DISABLED: process.env.AUTH_DISABLED ?? "true",
    SESSION_SECRET: process.env.SESSION_SECRET ?? "change-me-to-a-random-string-at-least-32-chars",
  },
});

child.on("exit", (code) => process.exit(code ?? 0));
