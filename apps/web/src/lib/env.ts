import "server-only";
import { validateWebStartupEnv } from "@apoul/shared";

let validated = false;

/** 起動時に1回だけ実行（instrumentation / middleware） */
export function validateWebEnv(): void {
  if (validated) return;
  validateWebStartupEnv();
  validated = true;
}
