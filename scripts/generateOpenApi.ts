import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildApp } from "../apps/api/src/app.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

async function main() {
  const app = buildApp();
  await app.ready();
  const doc = app.swagger();
  const outDir = join(ROOT, "docs");
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "openapi.json");
  writeFileSync(outPath, `${JSON.stringify(doc, null, 2)}\n`, "utf8");
  console.log(`OpenAPI written: ${outPath}`);
  await app.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
