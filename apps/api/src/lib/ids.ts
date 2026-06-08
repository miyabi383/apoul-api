// src/server/lib/ids.ts

import { createHash, randomBytes } from "node:crypto";

export function genRef(prefix: string): string {
  const rand = randomBytes(8).toString("hex");
  return `${prefix}_${rand}`;
}

export function hashPayload(payload: unknown): string {
  const normalized = stableStringify(payload);
  return createHash("sha256").update(normalized).digest("hex");
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(",")}}`;
}
