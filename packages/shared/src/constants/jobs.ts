/** Job status — Prisma enum と同期（Phase 1.5-5 で schema 参照に寄せる） */
export const JOB_STATUSES = [
  "pending",
  "processing",
  "success",
  "retrying",
  "fail",
  "dead",
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];
