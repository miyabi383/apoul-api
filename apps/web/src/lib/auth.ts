import "server-only";
import { getSession, atLeast, type Session } from "./session";
import { isAuthDisabled } from "./auth-config";

export { getSession, atLeast, type Session };

export function canRetry(role: string | undefined): boolean {
  if (isAuthDisabled()) return true;
  return atLeast(role, "admin");
}

export function canManageSystems(role: string | undefined): boolean {
  if (isAuthDisabled()) return true;
  return atLeast(role, "admin");
}
