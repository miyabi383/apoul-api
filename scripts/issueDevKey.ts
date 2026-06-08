// scripts/issueDevKey.ts

import { PrismaClient } from "@prisma/client";
import { generateApiKey } from "../apps/api/src/auth/apiKey";
import { genRef } from "../apps/api/src/lib/ids";

const prisma = new PrismaClient();

async function main() {
  const systemCode = process.argv[2];
  const scopesArg = process.argv[3];
  if (!systemCode || !scopesArg) {
    console.error('Usage: npm run issue-key -- <systemCode> "scope1,scope2"');
    process.exit(1);
  }
  const scopes = scopesArg.split(",").map((s) => s.trim()).filter(Boolean);
  const system = await prisma.system.findUnique({ where: { code: systemCode } });
  if (!system) {
    console.error(`system not found: ${systemCode}`);
    process.exit(1);
  }

  const client = await prisma.apiClient.create({
    data: {
      ref: genRef("cli"),
      systemId: system.id,
      name: `dev-${systemCode}-${Date.now()}`,
      scopes,
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

  console.log(issued.plaintext);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
