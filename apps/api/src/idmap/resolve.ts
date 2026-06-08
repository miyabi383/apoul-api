// src/server/idmap/resolve.ts

import { prisma } from "../db";

export type IdMapResult =
  | { ok: true; remoteId: string }
  | { ok: false; code: "MAPPING_PENDING"; message: string };

export async function resolveIdMapping(input: {
  systemId: bigint;
  entityType: string;
  localId: string;
  remoteSystem: string;
}): Promise<IdMapResult> {
  const row = await prisma.idMapping.findFirst({
    where: {
      systemId: input.systemId,
      entityType: input.entityType,
      localId: input.localId,
      remoteSystem: input.remoteSystem,
    },
  });
  if (!row) {
    return {
      ok: false,
      code: "MAPPING_PENDING",
      message: `no mapping for ${input.entityType}:${input.localId} -> ${input.remoteSystem}`,
    };
  }
  return { ok: true, remoteId: row.remoteId };
}

export type ApplyIdMappingsResult =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; code: "MAPPING_PENDING"; message: string };

export async function applyIdMappings(
  systemId: bigint,
  targetSystemCode: string,
  data: Record<string, unknown>,
  mappingFields: Array<{ field: string; entityType: string }>,
): Promise<ApplyIdMappingsResult> {
  const out = { ...data };
  for (const mf of mappingFields) {
    const localId = out[mf.field];
    if (typeof localId !== "string" || !localId) continue;
    const resolved = await resolveIdMapping({
      systemId,
      entityType: mf.entityType,
      localId,
      remoteSystem: targetSystemCode,
    });
    if (!resolved.ok) return resolved;
    out[mf.field] = resolved.remoteId;
  }
  return { ok: true, data: out };
}
