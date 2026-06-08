# APOUL API SYSTEM — ゴール & 進捗管理

> 最終更新: 2026-06-08  
> このファイルを作業のたびに更新し、常に現状を把握する。

---

## 1. プロジェクトゴール

### 最終ゴール（Phase 1 / MVP）

**イベント連携ハブ「APOUL」** をローカル環境で完全に動作させ、以下を達成する。

| 項目 | 内容 |
|------|------|
| **受信** | 外部システムからイベントを API キー認証付きで受信（冪等性・バリデーション） |
| **変換** | transform_rules / id_mappings に基づきペイロードを変換 |
| **配送** | 宛先システムへ HTTP 配送（SSRF 対策付き） |
| **ジョブ管理** | 失敗時リトライ / dead 化 / 監査ログ |
| **管理画面** | Next.js（全体マップ / フロー / Jobs / Systems / Clients） |
| **品質** | 結合テスト T1〜T8 全 green、`tsc` 0 エラー |

### 完了判定（M1: MVP 疎通）

[`APOUL_local_verification_checklist.md`](./APOUL_local_verification_checklist.md) の **§4〜§9** がすべて green。

---

## 2. フェーズ分解

| フェーズ | スコープ | 状態 |
|----------|----------|------|
| **1-A** リポジトリ整備 | package.json / tsconfig / ディレクトリ | ✅ 完了 |
| **1-B** データ層 | Prisma schema / seed / migration SQL | ✅ 完了 |
| **1-C** API サーバー | Fastify 一式 + routes/map API | ✅ 完了 |
| **1-D** 管理画面 | Next.js 全画面 + フロー + スフィアマップ | ✅ 完了 |
| **1-E** テスト & 検証 | vitest / typecheck / build | ✅ **test 9/9 green** |
| **2** 運用強化 | Worker / レート制限 / Webhook 署名 | ⏸ Phase 1 後 |

---

## 3. 現在の進捗サマリー

### 全体進捗: **~95%**（M1 疎通ほぼ完了）

```
[███████████████████░] 95%
```

### サブシステム別

| 領域 | 状態 | 備考 |
|------|------|------|
| Fastify API | ✅ | events / jobs / systems / clients / routes / map |
| Prisma (18表) | ✅ | migrate + seed 完了 |
| 管理 UI | ✅ | ライト/ダーク、日本語、`AUTH_DISABLED` |
| **全体マップ** `/map` | ✅ | スフィア版・実 API 連携可 |
| **フローエディタ** `/flows` | ✅ | Make.com 風・React Flow |
| Jobs / Systems / Clients | ✅ | 実データ表示 |
| 結合テスト T1〜T8 | ✅ | **9/9 green** |
| `npm run typecheck` | ✅ | 0 エラー |
| `next build` | ✅ | 2026-06-08 確認 |

### 現在のランタイム

| サービス | 状態 |
|----------|------|
| Next.js `:3000` | ✅ 稼働中 |
| Fastify `:4100` | ✅ 稼働中 |
| PostgreSQL `:5432` | ✅ 稼働中（PostgreSQL 17） |
| `APOUL_SERVICE_TOKEN` | ✅ 設定済 |

---

## 4. 詳細チェックリスト

### 1-B データ層

- [x] schema / seed / issueDevKey
- [x] migration SQL (`prisma/migrations/`)
- [x] `docker-compose.yml` 追加
- [x] `scripts/setup-local.sh` 追加
- [x] `prisma migrate deploy` 成功
- [x] `npm run seed` 成功

### 1-D 管理画面（追加分）

- [x] ライト/ダークテーマ切替
- [x] 日本語 i18n (`src/lib/i18n/ja.ts`)
- [x] `AUTH_DISABLED` 開発モード
- [x] `/map` スフィア全体マップ
- [x] `/flows` ビジュアルフローエディタ
- [x] `GET /v1/map/overview` / `GET/POST /v1/routes`

### 1-E テスト & 検証

- [x] integration.test.ts T1〜T8 実装済み
- [x] typecheck / next build
- [x] vitest 全 green（9/9）
- [x] API 手動疎通（health OK）

---

## 5. 作業ログ

| 日時 | 作業 | 結果 |
|------|------|------|
| 2026-06-08 | MVP コードベース構築 | tsc 0 エラー |
| 2026-06-08 | UI 刷新（ライト/ダーク・日本語） | build OK |
| 2026-06-08 | フローエディタ `/flows` | React Flow |
| 2026-06-08 | スフィア全体マップ `/map` | デモデータ可 |
| 2026-06-08 | docker-compose + setup-local.sh | DB 起動手順整備 |
| 2026-06-08 | setup-local.sh 修正 + setup-local.ps1 | Windows 対応 |
| 2026-06-08 | PostgreSQL 17 インストール + migrate/seed | DB 稼働 |
| 2026-06-08 | outbound URL 結合バグ修正 | T1/T5 修正 |
| 2026-06-08 | 結合テスト 9/9 green | **M1 疎通達成** |

---

## 6. ブロッカー

**なし** — M1 疎通完了。Phase 2（認証本実装・Worker 分離等）は任意。

---

## 7. 次のアクション（優先順）

```bash
# 1) PostgreSQL 起動（Docker がある場合）
docker compose up -d

# 2) DB + seed + キー発行
bash scripts/setup-local.sh          # Git Bash / WSL
# または
powershell -File scripts/setup-local.ps1   # Windows PowerShell
# → 出力キーを .env の APOUL_SERVICE_TOKEN に設定

# 3) 起動
npm run api:dev    # :4100
npm run web:dev    # :3000

# 4) 検証
npm run test
npm run typecheck
```

**M1 完了まで残り:** migrate → seed → token → test green → 手動疎通

---

## 8. 画面一覧（開発中）

| URL | 用途 |
|-----|------|
| `/map` | 全体マップ（スフィア版） |
| `/flows` | 連携フロー編集 |
| `/jobs` | ジョブ監視 |
| `/systems` | システム管理 |
| `/api-clients` | API キー管理 |
| `/project-progress` | WBS 進捗 |

---

*作業を進めるたびに §3・§5・§6 を更新すること。*
