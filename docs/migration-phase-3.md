# Phase 3 — Worker 分離

> `/v1/events` は Job 作成のみ。配送は Worker が非同期処理。

## 完了内容

| 項目 | 実装 |
|------|------|
| ingest 非同期化 | `jobService.onJobsCreated()` — 同期 `processJob` 削除 |
| Job 処理 | `jobProcessor.ts` — `processNextJob` / `drainAllJobs` |
| Worker | `apps/worker` — DB ポーリング + `/health` :4200 |
| 競合回避 | `processJob` 開始時に pending/retrying → processing を原子的 claim |
| Docker | `docker-compose.yml` — postgres / api / web / worker |
| テスト | `worker.test.ts` W1 + integration drain |

## アーキテクチャ

```
POST /v1/events
  → InboundEvent + Job (pending)
  → 202 即返却

Worker (poll)
  → pending/retrying Job 取得
  → processJob()
  → success / retrying / fail / dead

POST /v1/jobs/:id/retry
  → processJob() 同期（管理操作）
```

## コマンド

```bash
# 3 プロセス開発
pnpm api:dev       # :4100
pnpm web:dev       # :3000
pnpm worker:dev    # health :4200

# Docker 4 分割
docker compose up -d
curl http://localhost:4200/health
```

## 環境変数

```bash
WORKER_POLL_MS=1000
WORKER_HEALTH_PORT=4200
```

## テスト

```bash
pnpm test
# integration 9 + security 6 + worker 1 = 16
```

## 次: Phase 4

- CSS 分割
- Playwright E2E
- OpenAPI 生成
