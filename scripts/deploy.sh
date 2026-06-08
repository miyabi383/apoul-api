#!/usr/bin/env bash
# 無料本番デプロイ — Neon + Render + Vercel
# 前提: GitHub リポジトリ、各サービスのアカウント
set -euo pipefail
cd "$(dirname "$0")/.."

STRIPE="${STRIPE_CLI:-stripe}"
if ! command -v "$STRIPE" >/dev/null 2>&1; then
  STRIPE="/c/Users/kakiu/AppData/Local/Microsoft/WinGet/Packages/Stripe.StripeCli_Microsoft.Winget.Source_8wekyb3d8bbwe/stripe.exe"
fi

echo "==> 1/5 Stripe Projects（Neon DB）"
if [ -x "$STRIPE" ] || command -v "$STRIPE" >/dev/null 2>&1; then
  "$STRIPE" projects status --json >/dev/null 2>&1 || "$STRIPE" projects init --json --yes
  "$STRIPE" projects add neon/postgres --json --yes || echo "Neon: 手動で DATABASE_URL を設定"
else
  echo "Stripe CLI 未インストール → https://neon.tech で DATABASE_URL を取得"
fi

echo ""
echo "==> 2/5 Git push（Render Blueprint 用）"
if git remote get-url origin >/dev/null 2>&1; then
  git push -u origin main || git push -u origin master
else
  echo "git remote add origin <your-github-repo> を実行してから Render Blueprint を適用"
fi

echo ""
echo "==> 3/5 Render Blueprint"
echo "  https://dashboard.render.com → New → Blueprint → render.yaml"
echo "  DATABASE_URL / ADMIN_EMAIL / ADMIN_PASSWORD を設定"

echo ""
echo "==> 4/5 Render Shell 初回セットアップ"
echo "  pnpm prod:setup"

echo ""
echo "==> 5/5 Vercel（apps/web）"
if command -v npx >/dev/null 2>&1; then
  (cd apps/web && npx vercel --prod) || echo "vercel login 後: cd apps/web && npx vercel --prod"
else
  echo "cd apps/web && npx vercel --prod"
fi

echo ""
echo "詳細: docs/deploy-free.md"
