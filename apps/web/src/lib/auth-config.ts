import "server-only";

/** 開発専用: true の間はログイン・ロールチェックをスキップ（production では起動不可） */
export function isAuthDisabled(): boolean {
  return process.env.AUTH_DISABLED === "true";
}
