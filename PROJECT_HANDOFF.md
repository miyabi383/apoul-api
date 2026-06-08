# APOUL API SYSTEM — 現状整理（ChatGPT 引き継ぎ用）

> 作成日: 2026-06-08  
> 用途: 外部 LLM（ChatGPT 等）に渡し、**整理・最適化・再構築**の設計・実装計画を依頼するためのスナップショット

---

## 0. このドキュメントの使い方

ChatGPT には以下を添えて依頼する:

```
添付の PROJECT_HANDOFF.md を読み、APOUL API SYSTEM を整理・最適化して再構築する計画を立ててください。

求める成果物:
1. 現状の問題点・技術的負債の整理
2. 推奨アーキテクチャ（monorepo 分割の要否含む）
3. Phase 1 MVP を維持した再構築ロードマップ
4. ディレクトリ構成案
5. 優先して直すべき項目 Top 10
6. 破壊的変更の有無と移行手順
```

---

## 1. プロジェクト概要

| 項目 | 内容 |
|------|------|
| **名称** | APOUL API SYSTEM（イベント連携ハブ） |
| **目的** | 複数 SaaS / 内部システム間のイベントを受信 → 変換 → 配送する統合レイヤ |
| **フェーズ** | Phase 1 MVP 完了 → Phase 4 まで実施（monorepo / Worker / E2E / OpenAPI） |
| **リポジトリ** | pnpm monorepo（`apps/api`, `apps/web`, `apps/worker`, `packages/*`） |
| **言語** | TypeScript（Node.js 22+ 想定） |
| **DB** | PostgreSQL 16+（Prisma ORM） |

### 代表ユースケース（seed デモ）

```
契約システム (contract)
  → イベント contract.approved 受信
  → transform_rules でフィールドマッピング
  → id_mappings で customerId 変換（未登録時 retrying）
  → 請求システム (billing) の /invoices へ POST
  → ジョブ status: success / retrying / fail / dead
```

---

## 2. 技術スタック

| 層 | 技術 |
|----|------|
| API | Fastify 5, Zod, argon2 |
| ORM | Prisma 6（18 テーブル） |
| 管理 UI | Next.js 15 App Router, React 19 |
| フロー/マップ UI | @xyflow/react (React Flow) |
| テスト | Vitest 16 件（結合 9 + セキュリティ 6 + Worker 1）、Playwright E2E 6 件 |
| 実行 | tsx（dev）、turbo（typecheck/test/build）、Worker ポーリング |

### pnpm scripts（ルート）

```json
{
  "api:dev": "pnpm --filter @apoul/api dev",       // :4100
  "web:dev": "pnpm --filter @apoul/web dev",       // :3000
  "worker:dev": "pnpm --filter @apoul/worker dev", // health :4200
  "seed": "pnpm --filter @apoul/db seed",
  "sync-dev-token": "tsx scripts/syncDevToken.ts", // .env + .env.local 更新
  "issue-key": "pnpm --filter @apoul/db exec tsx ...",
  "test": "turbo run test",                        // API 16 tests
  "test:e2e": "pnpm --filter @apoul/web test:e2e",
  "typecheck": "turbo run typecheck",
  "build": "turbo run build",
  "openapi:generate": "tsx scripts/generateOpenApi.ts"
}
```

---

## 3. ディレクトリ構成（現状）

```
APOUL API/
├── apps/
│   ├── api/src/              # Fastify API（routes, services, auth, transform）
│   ├── api/test/             # Vitest 16 件
│   ├── web/src/              # Next.js App Router + e2e/
│   └── worker/src/           # Job ポーリング Worker（health :4200）
├── packages/
│   ├── db/prisma/            # schema + migrations + seed
│   └── shared/src/           # Envelope Zod, security config
├── scripts/
│   ├── syncDevToken.ts       # .env + apps/web/.env.local 更新
│   ├── issueDevKey.ts
│   ├── generateOpenApi.ts
│   └── setup-local.ps1 / .sh
├── docs/
│   ├── openapi.json
│   └── migration-phase-*.md
├── pnpm-workspace.yaml
├── turbo.json
└── docker-compose.yml        # postgres / api / web / worker
```

**設計上の特徴**

- `@/` エイリアス → `apps/web/src/`
- **pnpm monorepo + turbo**（Phase 1.5 完了）
- Web → API: Server Component から `APOUL_API_URL` + `APOUL_SERVICE_TOKEN`
- ジョブ処理: **ingest は enqueue のみ → Worker が `processNextJob` ポーリング**（Phase 3）

---

## 4. データモデル（Prisma 18 表）

| モデル | 役割 |
|--------|------|
| User | 管理画面ログイン（owner/admin/viewer） |
| System | 連携先/送信元システム（code, baseUrl） |
| ApiClient / ApiKey | 外部 API キー認証（scopes, ipAllowlist） |
| InboundEvent | 受信イベント（冪等性: idempotencyKey + payloadHash） |
| Route | ルーティング定義（source → target, eventType, destinationPath） |
| TransformRule | フィールドマッピング JSON |
| IdMapping | エンティティ ID 変換（localId ↔ remoteId） |
| Job / JobAttempt | 配送ジョブと試行履歴 |
| AuditLog | 監査ログ |
| ProgressItem | WBS 進捗（管理画面用） |
| HealthCheckTarget / HealthCheckRun | ヘルスチェック |
| OperationLog | 運用ログ |
| IdempotencyRecord | 冪等性記録 |

---

## 5. API エンドポイント一覧

### 認証不要

| Method | Path | 説明 |
|--------|------|------|
| GET | `/health` | LB 用ヘルス |
| POST | `/v1/auth/login` | 人間ログイン（メール/パスワード） |

### API キー認証必須（`/v1/*`）

| Method | Path | Scope 例 |
|--------|------|----------|
| POST | `/v1/events` | events:write |
| GET | `/v1/jobs`, `/v1/jobs/:id` | jobs:read |
| POST | `/v1/jobs/:id/retry`, `/dead` | jobs:retry, jobs:dead |
| GET/POST/PATCH | `/v1/systems` | systems:read/write |
| GET/POST/PATCH | `/v1/api-clients` | clients:read/write |
| GET/POST/PATCH | `/v1/routes` | routes:read/write |
| GET | `/v1/map/overview` | systems:read |
| GET/PATCH | `/v1/progress` | progress:read/write |
| GET | `/v1/audit-logs` | audit:read |
| GET | `/v1/ops/summary` | ops:read |
| GET/POST | `/v1/health-checks` | health:read/run |

---

## 6. 管理画面（Next.js）

| URL | 機能 | 状態 |
|-----|------|------|
| `/` | `/map` へリダイレクト | ✅ |
| `/map` | スフィア型全体マップ（React Flow） | ✅ 実 API |
| `/flows` | Make.com 風フローエディタ | ✅ 保存 → POST /v1/routes |
| `/jobs` | ジョブ一覧・フィルタ・ビジュアル統計 | ✅ |
| `/jobs/[id]` | ジョブ詳細・retry/dead | ✅ |
| `/systems` | システム CRUD | ✅ |
| `/api-clients` | API キー発行・失効 | ✅ |
| `/project-progress` | WBS 進捗表 | ✅ |
| `/login` | ログイン（**現状バイパス中**） | 🟡 |

### UI の現状

- 日本語 i18n: `src/lib/i18n/ja.ts`
- ライト/ダーク: `ThemeProvider` + `data-theme`
- イラスト風 UI: `src/components/illustrations/`（SVG 手描き風）
- フォント: Nunito + Zen Maru Gothic（next/font）
- **CSS は `apps/web/src/styles/` に分割**（tokens / layout / components / pages）

---

## 7. 認証・セキュリティ（現状）

| 方式 | 状態 |
|------|------|
| 外部 → API | Bearer API キー + scopes + IP allowlist |
| 管理画面 → API | `APOUL_SERVICE_TOKEN`（長期サービスキー） |
| 管理画面ログイン | Cookie セッション（実装済） |
| **`AUTH_DISABLED=true`** | 開発中: middleware バイパス（**本番起動時は禁止**） |
| SSRF 対策 | `ALLOW_LOCAL_DISPATCH` 未設定時 private IP ブロック |
| レート制限 | login / events（`@fastify/rate-limit`） |
| OpenAPI | `/docs` UI + `docs/openapi.json` |
| Webhook 署名 | **未実装** |

---

## 8. テスト・品質（2026-06-08 時点）

| 項目 | 結果 |
|------|------|
| `pnpm typecheck` | ✅ |
| `pnpm build` | ✅ |
| `pnpm test` | ✅ **16/16 green**（結合 9 + セキュリティ 6 + Worker 1） |
| `pnpm test:e2e` | ✅ **6/6 green**（1 skip: AUTH_DISABLED 時 login form） |
| `pnpm openapi:generate` | ✅ |

### 結合テストシナリオ

| ID | 内容 |
|----|------|
| T1 | 正常系: 受信 → success → 配送確認 |
| T2 | 同 payload 再送 → 200、ジョブ増えない |
| T3 | 同キー異 payload → 409 |
| T4 | MAPPING_PENDING → retrying、配送なし |
| T5 | マッピング登録後 retry → success |
| T6 | retry 反復で destinationKey 不変 |
| T7 | source 不一致 → 403 |
| T8a | envelope 必須欠落 → 400 |
| T8b | payload customerId 欠落 → dead |

---

## 9. 環境変数

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/apoul?schema=public
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=ChangeMe-strong-passw0rd
SEED_BILLING_MAPPING=true
BILLING_BASE_URL=http://localhost:4101/mock/billing
APOUL_API_URL=http://localhost:4100
APOUL_SERVICE_TOKEN=          # pnpm sync-dev-token で自動更新
SESSION_SECRET=...
PORT=4100
ALLOW_LOCAL_DISPATCH=true       # ローカル mock 配送許可
AUTH_DISABLED=true              # 開発用ログインバイパス
```

### ローカル起動手順

```bash
# PostgreSQL（docker compose up -d またはローカル PG）
powershell -File scripts/setup-local.ps1   # migrate + seed + sync-dev-token
# または: pnpm db:deploy && pnpm sync-dev-token

pnpm api:dev      # :4100
pnpm web:dev      # :3000
pnpm worker:dev   # :4200（Job 処理に必要）
pnpm test
pnpm test:e2e     # 自動 seed + トークン + サーバー起動
```

---

## 10. 完了していること（M1）

- [x] イベント受信（冪等性・バリデーション）
- [x] transform + id_mapping + HTTP 配送
- [x] ジョブ lifecycle（pending → processing → success/retrying/fail/dead）
- [x] retry / dead API + 監査ログ
- [x] 管理画面 6 画面 + フロー/マップ
- [x] 結合テスト全 green
- [x] PostgreSQL migrate/seed
- [x] outbound URL 結合バグ修正（baseUrl に path がある場合）

---

## 11. 未実装・後回し（Phase 5 以降）

| 項目 | 備考 |
|------|------|
| **認証本番化 E2E** | `AUTH_DISABLED=false` 時の login form テスト |
| **Webhook 署名検証** | rawBody 保持が必要 |
| **CI/CD** | GitHub Actions（`.github/workflows/ci.yml`） |
| **無料本番** | Neon + Render + Vercel — [docs/deploy-free.md](./docs/deploy-free.md) |
| **AWS 本番** | 未実施（有料・スケール時） |
| **UI コンポーネント体系** | shadcn 等未導入 |
| **監査ログ UI** | API のみ、画面なし |
| **health-check UI** | API のみ、画面なし |

---

## 12. 既知の技術的負債・リスク

1. **AUTH_DISABLED**: 本番前に必ず解除・テスト必要（起動ガードは実装済）
2. **BFF 二重化**: Next `/api/*` と Fastify `/v1/*` が混在
3. **サービストークン**: 管理画面全体で 1 トークン。`sync-dev-token` で再発行必要
4. **フローエディタ**: レイアウトは localStorage、サーバー永続化は routes のみ
5. **E2E + 手動 dev**: `web:dev` 実行中は `.env` 更新後に再起動が必要
6. **Windows**: PostgreSQL は docker compose または手動インストール

---

## 13. 再構築時に検討すべき論点（ChatGPT へのヒント）

### アーキテクチャ

- Turborepo / pnpm workspace で `apps/api`, `apps/web`, `packages/db`, `packages/shared` に分割するか
- ジョブ処理を BullMQ / pg-boss / 自前 DbQueue Worker に分離するか
- BFF を Next API Routes に統一するか、Server Actions + 直接 Fastify か

### UI

- globals.css を CSS Modules / Tailwind + shadcn に移行するか
- フロー/マップを独立パッケージ化するか
- イラスト SVG をデザインシステム（アイコンセット）に整理するか

### API

- OpenAPI 仕様書の生成
- events の Webhook 署名（Stripe 式）対応
- バージョニング `/v1` の将来方針

### 運用

- Docker Compose（api + web + postgres + worker）
- GitHub Actions CI（test + build + migrate check）
- 本番 secrets 管理

---

## 14. 再構築時に **維持すべき** コア仕様

以下は結合テストで担保されているため、再構築後も同等の振る舞いが必要:

1. イベント envelope バリデーション
2. idempotencyKey + payloadHash による冪等性
3. Route → TransformRule → IdMapping → outbound のパイプライン
4. Job status 遷移と JobAttempt 記録
5. destinationKey テンプレート（`billing-ctr_{contractId}-invoice-v1`）
6. scope ベース API キー認証
7. SSRF 対策（private host ブロック）

---

## 15. 関連ファイル（重要度順）

| ファイル | 理由 |
|----------|------|
| `packages/db/prisma/schema.prisma` | ドメインモデルの源泉 |
| `apps/api/src/services/ingest.ts` | イベント受信エントリ |
| `apps/api/src/services/jobProcessor.ts` | Worker 用ジョブ処理 |
| `apps/worker/src/main.ts` | Worker ポーリング |
| `apps/api/test/integration.test.ts` | 受け入れ基準 |
| `apps/web/e2e/` | Playwright E2E |
| `docs/openapi.json` | API 仕様 |
| `scripts/syncDevToken.ts` | 開発用トークン同期 |

---

## 16. 進捗サマリー

```
全体: Phase 5 完了（無料本番デプロイ基盤 + CI）
```

**ブロッカー: なし**

デプロイ手順: [docs/deploy-free.md](docs/deploy-free.md)

---

*このファイルは ChatGPT / 他 LLM への引き継ぎ用。コード変更時は §10〜§12 を更新すること。*
