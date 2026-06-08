// src/server/lib/observability.ts

import { prisma } from "../db";
import { genRef } from "./ids";

type LogOperationInput = {
  category: string;
  level?: "info" | "warn" | "error";
  message: string;
  meta?: Record<string, unknown>;
  requestId?: string | null;
};

export async function logOperation(input: LogOperationInput): Promise<void> {
  try {
    await prisma.operationLog.create({
      data: {
        ref: genRef("op"),
        category: input.category,
        level: input.level ?? "info",
        message: input.message,
        meta: (input.meta ?? undefined) as object | undefined,
        requestId: input.requestId ?? null,
      },
    });
  } catch {
    // 観測ログ失敗で本処理を落とさない
  }
}
