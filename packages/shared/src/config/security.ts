/** 本番で AUTH_DISABLED=true を禁止 */
export function assertAuthNotDisabledInProduction(
  nodeEnv: string | undefined = process.env.NODE_ENV,
  authDisabled: string | undefined = process.env.AUTH_DISABLED,
): void {
  if (nodeEnv === "production" && authDisabled === "true") {
    throw new Error("AUTH_DISABLED=true is not allowed in production");
  }
}

/** 本番で SESSION_SECRET 必須（32文字以上） */
export function assertSessionSecret(
  nodeEnv: string | undefined = process.env.NODE_ENV,
  secret: string | undefined = process.env.SESSION_SECRET,
): void {
  if (nodeEnv === "production" && (!secret || secret.length < 32)) {
    throw new Error("SESSION_SECRET must be set to at least 32 characters in production");
  }
}

/** Web が API を呼ぶ際の Service Token 必須（AUTH_DISABLED 時はスキップ可） */
export function assertServiceToken(
  nodeEnv: string | undefined = process.env.NODE_ENV,
  token: string | undefined = process.env.APOUL_SERVICE_TOKEN,
  authDisabled: string | undefined = process.env.AUTH_DISABLED,
): void {
  if (authDisabled === "true") return;
  if (nodeEnv === "production" && !token) {
    throw new Error("APOUL_SERVICE_TOKEN must be set in production");
  }
}

export function validateApiStartupEnv(): void {
  assertAuthNotDisabledInProduction();
}

export function validateWebStartupEnv(): void {
  assertAuthNotDisabledInProduction();
  assertSessionSecret();
  assertServiceToken();
}
