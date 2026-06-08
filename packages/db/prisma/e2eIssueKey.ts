import { PrismaClient } from "@prisma/client";
import { generateApiKey } from "../../../apps/api/src/auth/apiKey";
import { genRef } from "../../../apps/api/src/lib/ids";

const prisma = new PrismaClient();

const E2E_SCOPES = [
  "systems:read",
  "systems:write",
  "jobs:read",
  "jobs:retry",
  "routes:read",
  "clients:read",
  "events:write",
  "health:read",
  "progress:read",
  "audit:read",
  "ops:read",
];

async function main() {
  const system = await prisma.system.findUnique({ where: { code: "contract" } });
  if (!system) {
    throw new Error("contract system not found — run pnpm seed first");
  }

  const client = await prisma.apiClient.create({
    data: {
      ref: genRef("cli"),
      systemId: system.id,
      name: `e2e-${Date.now()}`,
      scopes: E2E_SCOPES,
      status: "active",
    },
  });

  const issued = await generateApiKey(process.env.NODE_ENV === "test" ? "test" : "live");
  await prisma.apiKey.create({
    data: {
      ref: genRef("key"),
      clientId: client.id,
      keyHash: issued.keyHash,
      keyPrefix: issued.keyPrefix,
    },
  });

  process.stdout.write(issued.plaintext);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
