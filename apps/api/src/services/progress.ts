// src/server/services/progress.ts

import { prisma } from "../db";
import { genRef } from "../lib/ids";

export async function listProgress(projectCode?: string) {
  const items = await prisma.progressItem.findMany({
    where: projectCode ? { projectCode } : undefined,
    orderBy: [{ sortOrder: "asc" }, { wbsCode: "asc" }],
  });
  return items.map((p) => ({
    id: p.ref,
    projectCode: p.projectCode,
    wbsCode: p.wbsCode,
    title: p.title,
    status: p.status,
    percent: p.percent,
    note: p.note,
  }));
}

export async function updateProgress(ref: string, data: { status?: string; percent?: number; note?: string | null }) {
  const item = await prisma.progressItem.findUnique({ where: { ref } });
  if (!item) return null;
  const updated = await prisma.progressItem.update({
    where: { id: item.id },
    data: {
      ...(data.status ? { status: data.status as "not_started" | "in_progress" | "done" | "blocked" } : {}),
      ...(data.percent !== undefined ? { percent: data.percent } : {}),
      ...(data.note !== undefined ? { note: data.note } : {}),
    },
  });
  return { id: updated.ref, status: updated.status, percent: updated.percent, note: updated.note };
}

export async function seedProgressIfEmpty() {
  const count = await prisma.progressItem.count();
  if (count > 0) return;
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
