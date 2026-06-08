# Phase 4 — 管理画面整理 / E2E / OpenAPI

## 完了内容

| 項目 | 実装 |
|------|------|
| CSS 分割 | `apps/web/src/styles/` — tokens / layout / components / pages |
| Playwright E2E | `apps/web/e2e/` — login, jobs, systems, flows |
| OpenAPI | `@fastify/swagger` + `/docs` UI + `docs/openapi.json` 生成 |

## CSS 構成

```
apps/web/src/styles/
├── tokens.css
├── layout.css
├── components.css
└── pages/
    ├── login.css
    ├── flows.css
    └── map.css
apps/web/src/app/globals.css  → @import のみ
```

## E2E

```bash
pnpm test:e2e
```

自動: seed → トークン発行 → API/Web 起動 → テスト

手動 dev サーバー利用時:

```bash
pnpm sync-dev-token          # .env 更新後 web:dev を再起動
PLAYWRIGHT_SKIP_WEBSERVER=1 pnpm test:e2e
```

## OpenAPI

```bash
pnpm openapi:generate   # → docs/openapi.json
# 実行中 API: http://localhost:4100/docs
```

## 次: Phase 5

- GitHub Actions CI
- Docker 本番化
- AWS 移行
