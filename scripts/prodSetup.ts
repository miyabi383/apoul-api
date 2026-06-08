import { execSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { syncDevToken } from "./syncDevToken.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * 本番初回セットアップ（Render Shell 等で 1 回実行）
 * - migrate deploy
 * - seed（admin + contract/billing デモ）
 * - 管理画面用 service token 発行
 */
async function main() {
  execSync("pnpm db:deploy", { cwd: ROOT, stdio: "inherit", env: process.env });
  const token = syncDevToken();

  console.log("\n=== 本番初回セットアップ完了 ===\n");
  console.log("Vercel（管理画面）に以下を設定:");
  console.log(`  APOUL_API_URL=<Render API の URL>`);
  console.log(`  APOUL_SERVICE_TOKEN=${token}`);
  console.log(`  SESSION_SECRET=<Render と同じ値>`);
  console.log(`  AUTH_DISABLED=false`);
  console.log(`  NODE_ENV=production`);
  console.log("\nRender API にも APOUL_SERVICE_TOKEN を同期してください。");
  console.log(`\n管理ログイン: ${process.env.ADMIN_EMAIL ?? "admin@example.com"}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
