// prisma/seed.ts

import { PrismaClient } from "@prisma/client";
import * as argon2 from "argon2";
import { genRef } from "../../../apps/api/src/lib/ids";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@example.com";
  const password = process.env.ADMIN_PASSWORD ?? "ChangeMe-strong-passw0rd";
  const seedMapping = process.env.SEED_BILLING_MAPPING !== "false";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    await prisma.user.create({
      data: {
        ref: genRef("usr"),
        email,
        passwordHash: await argon2.hash(password),
        role: "owner",
      },
    });
    console.log(`admin created: ${email}`);
  }

  const contract = await prisma.system.upsert({
    where: { code: "contract" },
    create: { ref: genRef("sys"), code: "contract", name: "契約システム", status: "active" },
    update: {},
  });

  const billing = await prisma.system.upsert({
    where: { code: "billing" },
    create: {
      ref: genRef("sys"),
      code: "billing",
      name: "請求システム",
      status: "active",
      baseUrl: process.env.BILLING_BASE_URL ?? "http://127.0.0.1:4101/mock/billing",
    },
    update: {
      baseUrl: process.env.BILLING_BASE_URL ?? "http://127.0.0.1:4101/mock/billing",
    },
  });

  const route = await prisma.route.upsert({
    where: {
      sourceSystemId_eventType_targetSystemId: {
        sourceSystemId: contract.id,
        eventType: "contract.approved",
        targetSystemId: billing.id,
      },
    },
    create: {
      ref: genRef("rte"),
      sourceSystemId: contract.id,
      targetSystemId: billing.id,
      eventType: "contract.approved",
      destinationPath: "/invoices",
      destinationKeyTpl: "billing-ctr_{contractId}-invoice-v1",
      enabled: true,
    },
    update: {},
  });

  const existingRule = await prisma.transformRule.findFirst({ where: { routeId: route.id } });
  if (!existingRule) {
    await prisma.transformRule.create({
      data: {
        ref: genRef("trf"),
        routeId: route.id,
        mapping: [
          { target: "contractId", source: "contractId", required: true },
          { target: "customerId", source: "customerId", required: true },
          { target: "amount", source: "amount", required: true },
          { target: "currency", source: "currency", required: false },
        ],
        enabled: true,
      },
    });
  }

  if (seedMapping) {
    await prisma.idMapping.upsert({
      where: {
        systemId_entityType_localId_remoteSystem: {
          systemId: contract.id,
          entityType: "customer",
          localId: "CUST-22",
          remoteSystem: "billing",
        },
      },
      create: {
        ref: genRef("map"),
        systemId: contract.id,
        entityType: "customer",
        localId: "CUST-22",
        remoteSystem: "billing",
        remoteId: "BILL-CUST-22",
      },
      update: {},
    });
    console.log("id_mappings: billing側を投入");
  } else {
    console.log("id_mappings: 未投入");
  }

  const wbsCount = await prisma.progressItem.count();
  if (wbsCount === 0) {
    const items = [
      { wbsCode: "1.1", title: "イベント受信 API", status: "done" as const, percent: 100 },
      { wbsCode: "1.2", title: "変換エンジン", status: "in_progress" as const, percent: 80 },
      { wbsCode: "1.3", title: "管理画面", status: "in_progress" as const, percent: 60 },
    ];
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      await prisma.progressItem.create({
        data: {
          ref: genRef("wbs"),
          projectCode: "apoul-mvp",
          wbsCode: it.wbsCode,
          title: it.title,
          status: it.status,
          percent: it.percent,
          sortOrder: i,
        },
      });
    }
  }

  console.log("seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
