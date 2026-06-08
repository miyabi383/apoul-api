// src/server/adapters/outbound.ts

import { URL } from "node:url";

function isPrivateHost(hostname: string): boolean {
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") return true;
  if (hostname.startsWith("10.") || hostname.startsWith("192.168.")) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(hostname)) return true;
  if (hostname.startsWith("169.254.")) return true;
  if (hostname.endsWith(".internal")) return true;
  return false;
}

export type DispatchResult = {
  ok: boolean;
  statusCode: number | null;
  body: string;
  errorCode?: string;
  errorMsg?: string;
};

function resolveDispatchUrl(baseUrl: string, path: string): URL {
  const base = new URL(baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
  const relativePath = path.startsWith("/") ? path.slice(1) : path;
  return new URL(relativePath, base);
}

export async function dispatchOutbound(input: {
  baseUrl: string;
  path: string;
  body: unknown;
  idempotencyKey: string;
}): Promise<DispatchResult> {
  const url = resolveDispatchUrl(input.baseUrl, input.path);
  if (!process.env.ALLOW_LOCAL_DISPATCH && isPrivateHost(url.hostname)) {
    return {
      ok: false,
      statusCode: null,
      body: "",
      errorCode: "SSRF_BLOCKED",
      errorMsg: `dispatch to private host blocked: ${url.hostname}`,
    };
  }

  try {
    const res = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "idempotency-key": input.idempotencyKey,
      },
      body: JSON.stringify(input.body),
    });
    const text = await res.text();
    return {
      ok: res.ok,
      statusCode: res.status,
      body: text.slice(0, 4000),
      ...(res.ok ? {} : { errorCode: "DISPATCH_FAILED", errorMsg: `HTTP ${res.status}` }),
    };
  } catch (e) {
    return {
      ok: false,
      statusCode: null,
      body: "",
      errorCode: "DISPATCH_ERROR",
      errorMsg: e instanceof Error ? e.message : "dispatch failed",
    };
  }
}
