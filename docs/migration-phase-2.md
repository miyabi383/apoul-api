# Phase 2 — 本番前セキュリティ

> Phase 1.5 完了後。本番投入前の必須セキュリティ強化。

## 完了内容

| 項目 | 実装 |
|------|------|
| AUTH_DISABLED 本番禁止 | `packages/shared/src/config/security.ts` — API/Web 起動時チェック |
| SESSION_SECRET 本番必須 | 32文字以上（Web `session.ts` + `instrumentation.ts`） |
| APOUL_SERVICE_TOKEN | 本番未設定時に Web API 呼び出し失敗 |
| login rate limit | `@fastify/rate-limit` — デフォルト 10 req/min/IP |
| events rate limit | デフォルト 120 req/min/client |
| 監査ログ拡張 | login 成功/失敗, scope拒否, IP拒否, 無効キー, rate limit |
| セキュリティテスト | `apps/api/test/security.test.ts` — S1〜S6 |

## 環境変数

```bash
# 開発専用（production では起動拒否）
AUTH_DISABLED=true

# 本番必須
SESSION_SECRET=...   # 32文字以上
APOUL_SERVICE_TOKEN=...

# Rate limit（省略可）
LOGIN_RATE_LIMIT_MAX=10
LOGIN_RATE_LIMIT_WINDOW_MS=60000
EVENTS_RATE_LIMIT_MAX=120
EVENTS_RATE_LIMIT_WINDOW_MS=60000
```

## 監査アクション一覧（Phase 2 追加分）

| action | タイミング |
|--------|-----------|
| `auth.login_success` | ログイン成功 |
| `auth.login_failed` | ログイン失敗 |
| `auth.scope_denied` | scope 不足 |
| `auth.ip_denied` | IP allowlist 拒否 |
| `auth.apikey_invalid` | 無効/失効キー |
| `rate_limit.exceeded` | rate limit 超過 |

## テスト

```bash
pnpm test
# integration 9 + security 6 = 15 tests
```

## 次: Phase 3

- Worker 分離（`/v1/events` は Job 作成のみ）
- Docker Compose 4 分割
- CI/CD
