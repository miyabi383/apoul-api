import { prisma } from "../db";
import { processJob } from "./processJob";

const PROCESSABLE = ["pending", "retrying"] as const;

/** 次に処理可能な Job ID（retry 待ちはスキップ） */
export async function findNextProcessableJobId(): Promise<bigint | null> {
  const now = new Date();
  const job = await prisma.job.findFirst({
    where: {
      status: { in: [...PROCESSABLE] },
      OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: now } }],
    },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  return job?.id ?? null;
}

/** 1 件処理。処理できなければ false */
export async function processNextJob(): Promise<boolean> {
  const id = await findNextProcessableJobId();
  if (!id) return false;
  await processJob(id);
  return true;
}

/** テスト / バックログ消化用 — キューが空になるまで処理 */
export async function drainAllJobs(limit = 50): Promise<number> {
  let processed = 0;
  while (processed < limit && (await processNextJob())) {
    processed += 1;
  }
  return processed;
}
