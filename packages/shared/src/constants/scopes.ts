/** API キー scope 定数 — Phase 1.5-5 で server/auth/scope.ts から移行 */
export const SCOPES = [
  "events:write",
  "jobs:read",
  "jobs:retry",
  "jobs:dead",
  "systems:read",
  "systems:write",
  "clients:read",
  "clients:write",
  "routes:read",
  "routes:write",
  "progress:read",
  "progress:write",
  "ops:read",
  "health:read",
  "health:run",
  "audit:read",
] as const;

export type Scope = (typeof SCOPES)[number];
