// src/server/auth/apiKey.ts

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import * as argon2 from "argon2";

const PREFIX = "apoul";

export type IssuedKey = {
  plaintext: string;
  keyHash: string;
  keyPrefix: string;
};

export async function generateApiKey(env: "live" | "test" = "live"): Promise<IssuedKey> {
  const secret = randomBytes(32).toString("base64url");
  const plaintext = `${PREFIX}_${env}_${secret}`;
  const keyHash = await argon2.hash(plaintext);
  const keyPrefix = plaintext.slice(0, 16);
  return { plaintext, keyHash, keyPrefix };
}

export async function verifyApiKey(plaintext: string, keyHash: string): Promise<boolean> {
  try {
    return await argon2.verify(keyHash, plaintext);
  } catch {
    return false;
  }
}

export function extractBearer(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  return m?.[1]?.trim() ?? null;
}

export function fingerprintKey(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex").slice(0, 16);
}

export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}
