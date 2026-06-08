#!/usr/bin/env bash
# APOUL ローカルセットアップ（PostgreSQL 起動後に実行）
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> Prisma migrate"
pnpm db:deploy

echo "==> Seed + service token"
pnpm sync-dev-token

echo ""
echo "==> 起動"
echo "  pnpm api:dev    # :4100"
echo "  pnpm web:dev    # :3000"
echo "  pnpm worker:dev # health :4200"
echo ""
echo "==> 検証"
echo "  pnpm test"
echo "  pnpm test:e2e"
