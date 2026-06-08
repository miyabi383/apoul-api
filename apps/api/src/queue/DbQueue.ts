// src/server/queue/DbQueue.ts

import { prisma } from "../db";
import type { Queue } from "./Queue";

export class DbQueue implements Queue {
  async enqueue(jobId: bigint): Promise<void> {
    await prisma.job.update({
      where: { id: jobId },
      data: { status: "pending", nextRetryAt: new Date() },
    });
  }
}

export const dbQueue = new DbQueue();
