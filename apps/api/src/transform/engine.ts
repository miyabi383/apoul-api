// src/server/transform/engine.ts

import { getByPath } from "../lib/jsonpath";

export type MappingRule = {
  target: string;
  source: string;
  required?: boolean;
};

export type TransformResult =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; code: string; message: string };

export function applyTransform(payload: unknown, rules: MappingRule[]): TransformResult {
  const out: Record<string, unknown> = {};
  for (const rule of rules) {
    const val = getByPath(payload, rule.source);
    if (val === undefined || val === null || val === "") {
      if (rule.required) {
        return { ok: false, code: "TRANSFORM_FAILED", message: `missing required field: ${rule.source}` };
      }
      continue;
    }
    out[rule.target] = val;
  }
  return { ok: true, data: out };
}

export function parseMapping(raw: unknown): MappingRule[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((r) => r && typeof r === "object" && "target" in r && "source" in r) as MappingRule[];
}
