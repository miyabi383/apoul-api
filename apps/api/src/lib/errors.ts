// src/server/lib/errors.ts

export const ErrorCodes = {
  VALIDATION_FAILED: "VALIDATION_FAILED",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  ROUTE_NOT_FOUND: "ROUTE_NOT_FOUND",
  SYSTEM_CODE_EXISTS: "SYSTEM_CODE_EXISTS",
  IDEMPOTENCY_CONFLICT: "IDEMPOTENCY_CONFLICT",
  SOURCE_SYSTEM_MISMATCH: "SOURCE_SYSTEM_MISMATCH",
  NO_ROUTE: "NO_ROUTE",
  TRANSFORM_FAILED: "TRANSFORM_FAILED",
  MAPPING_PENDING: "MAPPING_PENDING",
  DISPATCH_FAILED: "DISPATCH_FAILED",
  SSRF_BLOCKED: "SSRF_BLOCKED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 400,
    public details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}
