# Phase 1.5 — Monorepo 移行手順

> B案（堅牢本命）ベース。既存 MVP の挙動を壊さず、API / Web / DB / Shared の責務を分離する。

## 現在地（Phase 1.5 完了）

```
apoul-api-system/
├── apps/
│   ├── api/
│   │   ├── src/          # Fastify API（旧 src/server）
│   │   └── test/         # 結合テスト 9 件
│   ├── web/
│   │   └── src/          # Next.js（旧 src/app, components, lib）
│   └── worker/           # スタブ（Phase 3）
├── packages/
│   ├── db/
│   │   └── prisma/       # schema + migrations + seed
│   ├── shared/           # Envelope Zod, scope, job status
│   ├── auth/             # プレースホルダ（Phase 2）
│   └── logger/           # プレースホルダ（Phase 2）
├── scripts/
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

---

## コマンド

```bash
# 初回
pnpm install
pnpm db:generate

# 開発
pnpm api:dev          # Fastify :4100
pnpm web:dev          # Next.js :3000
pnpm worker:dev       # Worker スタブ

# 品質（Phase 1.5 完了条件）
pnpm typecheck        # turbo → 全 package
pnpm test             # 結合テスト 9 件
pnpm build            # Next.js build

# DB
pnpm db:generate
pnpm db:deploy
pnpm seed
pnpm db:validate
```

---

## フェーズ一覧

| Phase | 内容 | 状態 |
|-------|------|------|
| **1.5-1** | workspace / turbo / 器作成 | ✅ |
| **1.5-2** | `src/server` → `apps/api/src` | ✅ |
| **1.5-3** | `src/app` 等 → `apps/web/src` | ✅ |
| **1.5-4** | `prisma/` → `packages/db/prisma` | ✅ |
| **1.5-5** | Envelope Zod → `packages/shared` | ✅ |
| **1.5-6** | `test/` → `apps/api/test` | ✅ |
| **2** | AUTH 本番化 / rate limit / 監査 | ✅ [migration-phase-2.md](./migration-phase-2.md) |
| **3** | Worker 分離 / Docker 4 分割 | ✅ [migration-phase-3.md](./migration-phase-3.md) |
| **4** | CSS 分割 / E2E / OpenAPI | ✅ [migration-phase-4.md](./migration-phase-4.md) |
| **5** | CI/CD / 無料本番 | ✅ [migration-phase-5.md](./migration-phase-5.md) |

---

## Rollback（Phase 1.5）

1. `git checkout` で移行前のコミットに戻す（推奨）
2. 手動の場合: `apps/api/src` → `src/server`、`apps/web/src` → `src/`、`packages/db/prisma` → `prisma/` を逆移動
3. root `package.json` を npm 単体構成に戻す

---

## Phase 2 以降（TODO）

- `AUTH_DISABLED=true` を production で起動失敗させる
- login / events rate limit
- `processJob()` の Worker 分離
- `.github/workflows/ci.yml`
- Docker Compose: api / web / worker / postgres
