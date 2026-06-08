# Phase 5 — CI/CD / 無料本番デプロイ

## 完了内容

| 項目 | 実装 |
|------|------|
| 本番 Docker | `docker/Dockerfile.api`, `docker/Dockerfile.worker` |
| Render Blueprint | `render.yaml`（API + Worker 無料枠） |
| Vercel | `apps/web/vercel.json`（管理画面） |
| CI | `.github/workflows/ci.yml` |
| 初回セットアップ | `pnpm prod:setup` |
| 手順書 | [deploy-free.md](./deploy-free.md) |

## 無料構成

```
Neon (DB) + Render (API/Worker) + Vercel (Web) + GitHub Actions (CI)
```

## クイックスタート

1. Neon で DATABASE_URL 取得
2. GitHub に push
3. Render Blueprint 適用
4. Render Shell: `pnpm prod:setup`
5. Vercel で `apps/web` デプロイ

詳細: [deploy-free.md](./deploy-free.md)

## 次

- カスタムドメイン
- Render Starter / Fly.io への移行（常時起動）
- E2E を CI に追加（Playwright + preview URL）
