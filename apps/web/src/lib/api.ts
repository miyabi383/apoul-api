import "server-only";
import { cookies } from "next/headers";
import { isAuthDisabled } from "./auth-config";

const API = process.env.APOUL_API_URL ?? "http://localhost:4100";

function serviceToken(): string {
  const token = process.env.APOUL_SERVICE_TOKEN ?? "";
  if (!token && !isAuthDisabled()) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("APOUL_SERVICE_TOKEN must be set in production");
    }
    throw new ApiError(
      "MISSING_SERVICE_TOKEN",
      "APOUL_SERVICE_TOKEN が未設定です。pnpm issue-key で発行してください。",
      503,
    );
  }
  return token;
}

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, {
      method,
      headers: {
        authorization: `Bearer ${serviceToken()}`,
        ...(body ? { "content-type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
  } catch (e) {
    throw new ApiError("API_UNREACHABLE", e instanceof Error ? e.message : "API に接続できません", 503);
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = json?.error;
    throw new ApiError(err?.code ?? "API_ERROR", err?.message ?? res.statusText, res.status);
  }
  return json as T;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
};

export type JobRow = {
  id: string;
  status: string;
  eventType: string;
  sourceSystem: string;
  destinationKey: string;
  attemptCount: number;
  lastErrorCode: string | null;
  createdAt: string;
  updatedAt: string;
};

export type JobDetail = JobRow & {
  resourceId: string;
  payload: unknown;
  transformedBody: unknown;
  attempts: Array<{
    attemptNo: number;
    status: string;
    errorCode: string | null;
    errorMsg: string | null;
    responseCode: number | null;
    createdAt: string;
  }>;
};

export type SystemRow = {
  id: string;
  code: string;
  name: string;
  status: string;
  baseUrl: string | null;
  clients: number;
  updatedAt: string;
};

export type ClientRow = {
  id: string;
  name: string;
  systemCode: string;
  scopes: string[];
  status: string;
  keys: Array<{ prefix: string; lastUsedAt: string | null; revokedAt: string | null }>;
};

export type ProgressRow = {
  id: string;
  projectCode: string;
  wbsCode: string;
  title: string;
  status: string;
  percent: number;
  note: string | null;
};

export async function apiWithSession<T>(method: string, path: string, body?: unknown): Promise<T> {
  return request<T>(method, path, body);
}

export async function getCookieHeader(): Promise<string> {
  const jar = await cookies();
  return jar.toString();
}
