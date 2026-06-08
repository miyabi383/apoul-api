import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DB = resolve(ROOT, "packages/db");
const WEB_ROOT = resolve(ROOT, "apps/web");

function loadEnvFile(path: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!existsSync(path)) return out;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function upsertEnvVar(filePath: string, key: string, value: string) {
  if (!existsSync(filePath)) {
    writeFileSync(filePath, `${key}=${value}\n`, "utf8");
    return;
  }
  const lines = readFileSync(filePath, "utf8").split("\n");
  let found = false;
  const updated = lines.map((line) => {
    if (line.trim().startsWith(`${key}=`)) {
      found = true;
      return `${key}=${value}`;
    }
    return line;
  });
  if (!found) updated.push(`${key}=${value}`);
  writeFileSync(filePath, `${updated.join("\n").replace(/\n+$/, "")}\n`, "utf8");
}

export function syncDevToken(options: { seed?: boolean; writeFiles?: boolean } = {}): string {
  const writeFiles = options.writeFiles !== false;

  if (options.seed !== false) {
    execSync("pnpm seed", { cwd: ROOT, stdio: "inherit", env: process.env });
  }

  const envFile = existsSync(resolve(ROOT, ".env")) ? "--env-file=../../.env" : "";
  const token = execSync(`pnpm exec tsx ${envFile} ./prisma/e2eIssueKey.ts`.trim(), {
    cwd: DB,
    encoding: "utf8",
    env: process.env,
  }).trim();

  process.env.APOUL_SERVICE_TOKEN = token;

  if (!writeFiles) return token;

  upsertEnvVar(resolve(ROOT, ".env"), "APOUL_SERVICE_TOKEN", token);

  const rootEnv = loadEnvFile(resolve(ROOT, ".env"));
  writeFileSync(
    resolve(WEB_ROOT, ".env.local"),
    `${Object.entries({ ...rootEnv, APOUL_SERVICE_TOKEN: token })
      .map(([k, v]) => `${k}=${v}`)
      .join("\n")}\n`,
    "utf8",
  );

  return token;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const token = syncDevToken();
  console.log("APOUL_SERVICE_TOKEN を更新しました。");
  console.log("実行中の api:dev / web:dev がある場合は再起動してください。");
  console.log(token);
}
