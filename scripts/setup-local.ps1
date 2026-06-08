# APOUL ローカルセットアップ（PostgreSQL 起動後に実行）
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

Write-Host "==> Prisma migrate"
pnpm db:deploy

Write-Host "==> Seed + service token"
pnpm sync-dev-token

Write-Host ""
Write-Host "==> 起動"
Write-Host "  pnpm api:dev    # :4100"
Write-Host "  pnpm web:dev    # :3000"
Write-Host "  pnpm worker:dev # health :4200"
Write-Host ""
Write-Host "==> 検証"
Write-Host "  pnpm test"
Write-Host "  pnpm test:e2e"
