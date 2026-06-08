# @apoul/worker

Job 配送 Worker — `pending` / `retrying` Job を DB ポーリングして `processJob()` 実行。

```bash
pnpm worker:dev    # root から
# health: http://localhost:4200/health
```

環境変数: `WORKER_POLL_MS`, `WORKER_HEALTH_PORT`, `DATABASE_URL`, `BILLING_BASE_URL`, `ALLOW_LOCAL_DISPATCH`
