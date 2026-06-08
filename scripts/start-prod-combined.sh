#!/bin/sh
# API + Worker を 1 プロセスグループで起動（Render 無料枠向け）
set -eu
pnpm db:deploy
pnpm exec tsx apps/api/src/main.ts &
pnpm exec tsx apps/worker/src/main.ts &
wait
