// src/server/auth/ipAllowlist.ts

export function checkIpAllowlist(ip: string | undefined, allowlist: string[]): boolean {
  if (!allowlist.length) return true;
  if (!ip) return false;
  return allowlist.some((entry) => entry === ip || entry === "*");
}
