import "server-only";
import { cookies } from "next/headers";
import crypto from "crypto";
import { isAuthDisabled } from "./auth-config";

const COOKIE = "apoul_session";

function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === "production") {
    if (!secret || secret.length < 32) {
      throw new Error("SESSION_SECRET must be set to at least 32 characters in production");
    }
    return secret;
  }
  return secret ?? "dev-secret-dev-secret-dev-secret-12";
}

export type Session = {
  userId: string;
  email: string;
  role: "owner" | "admin" | "viewer";
};

const DEV_SESSION: Session = {
  userId: "dev-local",
  email: "dev@local (認証無効)",
  role: "owner",
};

const ROLE_RANK: Record<string, number> = { viewer: 1, admin: 2, owner: 3 };

export function atLeast(role: string | undefined, min: "viewer" | "admin" | "owner"): boolean {
  if (isAuthDisabled()) return true;
  return (ROLE_RANK[role ?? ""] ?? 0) >= ROLE_RANK[min];
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

function encode(session: Session): string {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decode(raw: string): Session | null {
  const [payload, sig] = raw.split(".");
  if (!payload || !sig || sign(payload) !== sig) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString()) as Session;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  if (isAuthDisabled()) return DEV_SESSION;
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;
  return decode(raw);
}

export async function setSession(session: Session): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, encode(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export { COOKIE };
