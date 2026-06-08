# APOUL API SYSTEM — ローカル検証 手順書 / チェックリスト
> Phase 1 / MVP 検証用 / 2026-06-08
> サンドボックスはネットワーク無効のため、本番相当の検証(prisma generate / tsc / vitest / next build / 疎通)はローカルまたはCursorで実施する。

---

## 0. 成果物の置き場所

これまでの出力ファイルを、リポジトリに次の構成で配置する想定。

```
apoul/
├─ prisma/
│  ├─ schema.prisma            ← schema.prisma
│  └─ seed.ts                  ← seed.ts
├─ scripts/
│  └─ issueDevKey.ts           ← scripts/issueDevKey.ts
├─ src/
│  ├─ server/                  ← Fastify(API) 一式
│  │  ├─ app.ts
│  │  ├─ db.ts
│  │  ├─ routes/ (events, jobs, progress, auth)
│  │  ├─ services/ (ingest, processJob, audit, login, progress)
│  │  ├─ transform/engine.ts
│  │  ├─ idmap/resolve.ts
│  │  ├─ queue/ (Queue, DbQueue)
│  │  ├─ adapters/outbound.ts
│  │  ├─ auth/ (apiKey, authenticate, scope, ipAllowlist)
│  │  ├─ validation/envelope.ts
│  │  └─ lib/ (ids, jsonpath, errors, observability, requestContext)
│  ├─ app/                     ← Next.js(管理画面) App Router
│  │  ├─ layout.tsx / globals.css / login/
│  │  ├─ (app)/ (layout, page, jobs, jobs/[id], project-progress)
│  │  └─ api/ (auth/login, auth/logout, jobs/[id]/retry, jobs/[id]/dead)
│  ├─ lib/ (api.ts, session.ts, auth.ts)   ← Next側の共有
│  └─ middleware.ts
├─ test/
│  ├─ integration.test.ts
│  └─ helpers/ (fixtures.ts, mockBilling.ts)
├─ vitest.config.ts
├─ package.json
├─ tsconfig.json
└─ .env / .env.test
```

> 注: `src/server`(Fastify) と `src/app`(Next) を1リポジトリに同居させている。実運用では monorepo(apps/api, apps/web)に分割してもよいが、MVPは同居で可。`@/` エイリアスは `src/` を指す前提(tsconfig paths)。

---

## 1. 前提ソフトウェア

- [ ] Node.js 22+(`node:sqlite`不要だが、fetch標準・base64url対応のため)
- [ ] PostgreSQL 13+(`gen_random_uuid()` のため。`pgcrypto` 拡張を有効化)
- [ ] パッケージマネージャ(npm/pnpm)

---

## 2. 依存パッケージ

```bash
# ランタイム
npm i fastify zod argon2 @prisma/client next react react-dom server-only
# 開発(tsx: ts-nodeのESM問題を避けるため採用)
npm i -D prisma typescript tsx @types/node vitest @types/react @types/react-dom
```

`package.json`(抜粋):
```jsonc
{
  "scripts": {
    "api:dev": "tsx watch src/server/main.ts",
    "web:dev": "next dev -p 3000",
    "seed": "tsx prisma/seed.ts",
    "issue-key": "tsx scripts/issueDevKey.ts",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "prisma": { "seed": "tsx prisma/seed.ts" }
}
```

> 起動エントリは `src/server/main.ts`(buildApp を listen)。`src/server/app.ts` は `buildApp()` を export するだけで listen しない(テストが import するため)。

`tsconfig.json`(paths が必須):
```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "jsx": "preserve",
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] },
    "types": ["node"]
  },
  "include": ["src", "test", "scripts", "prisma"]
}
```

---

## 3. 環境変数

`.env`(開発):
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/apoul?schema=public
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=ChangeMe-strong-passw0rd
SEED_BILLING_MAPPING=true          # ケースA(正常系)で投入。MAPPING_PENDINGを試すならfalse
BILLING_BASE_URL=http://localhost:4101/mock/billing   # 任意。モック宛先
# Next(管理画面)
APOUL_API_URL=http://localhost:4100
APOUL_SERVICE_TOKEN=               # 後述の手順5で発行して設定
SESSION_SECRET=<32文字以上のランダム文字列>
PORT=4100                          # Fastify
ALLOW_LOCAL_DISPATCH=true          # ローカル宛先(127.0.0.1等)への配送を許可(SSRFブロック緩和)
```

`.env.test`(テスト専用DB):
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/apoul_test?schema=public
SESSION_SECRET=test-secret-test-secret-test-1234
```

> チェック: 本番では `ALLOW_LOCAL_DISPATCH` を設定しない(内部IP/メタデータへの配送をブロックするSSRF対策)。

---

## 4. DB準備 → 型生成 → 型チェック

```bash
# 1) DB作成 & 拡張
createdb apoul && createdb apoul_test
psql apoul     -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"
psql apoul_test -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"

# 2) Prisma型生成
npx prisma generate

# 3) マイグレーション(開発DB)
npx prisma migrate dev --name init

# 4) TypeScript型チェック(全体)
npm run typecheck
```

チェックリスト:
- [ ] `prisma generate` 成功(`@prisma/client` 型が出る)
- [ ] `migrate dev` 成功(18テーブル作成、UNIQUE/INDEX反映)
- [ ] `tsc --noEmit` がエラー0
  - 詰まりやすい点: `@/*` paths 未設定 / `types:["node"]` 不足 / Next15のparams,searchParams は Promise(awaitしているか)

---

## 5. seed → サービスキー発行

```bash
# 開発DBへ投入(管理者・systems・route・rules・id_mappings・WBS)
npx prisma db seed

# 管理画面(Next)用のサービスキーを発行 → 出力を APOUL_SERVICE_TOKEN に設定
npm run issue-key -- contract "jobs:read,jobs:retry,jobs:dead,progress:read,progress:write,ops:read,health:read,health:run,audit:read,systems:read,systems:write,clients:read,clients:write"
# 出力された apoul_test_... を .env の APOUL_SERVICE_TOKEN に貼る
```

チェックリスト:
- [ ] seed 成功ログ(`id_mappings: billing側を投入` or `未投入`)
- [ ] 管理者 `ADMIN_EMAIL` が owner で作成された
- [ ] サービスキー発行 → `APOUL_SERVICE_TOKEN` 設定済み

---

## 6. 結合テスト(T1〜T8)

```bash
# テスト用DBにスキーマ適用
DATABASE_URL=$(grep DATABASE_URL .env.test | cut -d= -f2-) npx prisma migrate deploy

# 実行(.env.test を読ませる。dotenv-cli等 or 環境変数で渡す)
DATABASE_URL=<apoul_test> SESSION_SECRET=<test> npx vitest run
```

チェックリスト(全green):
- [ ] T1 正常系 受信→処理→success / 配送キー `billing-ctr_…-invoice-v1`
- [ ] T2 同payload再送=200・ジョブ増えない
- [ ] T3 同キー異payload=409
- [ ] T4 MAPPING_PENDING=retrying(deadにしない)・配送なし
- [ ] T5 マッピング登録後の手動retry=success・配送1回・監査あり
- [ ] T6 retry反復で宛先キー不変・ジョブ1件
- [ ] T7 source不一致=403
- [ ] T8a envelope必須欠落=400
- [ ] T8b payload customerId欠落=変換失敗でdead

詰まりやすい点:
- argon2 がネイティブビルドで失敗 → ビルドツール(対応するNode/OS)を確認。`vitest` のタイムアウトは30秒に設定済み。
- 並列実行でDB競合 → `vitest.config.ts` で `fileParallelism:false` 済み。

---

## 7. API疎通(手動・任意)

```bash
# Fastify起動
npm run api:dev    # → http://localhost:4100

# events用キー(events:writeのみ)を発行
npm run issue-key -- contract "events:write"      # 出力キーを EV=... に

# 受信(202)
curl -i -X POST http://localhost:4100/v1/events \
  -H "authorization: Bearer $EV" \
  -H "idempotency-key: contract-C-1001-approved-v1" \
  -H "content-type: application/json" \
  -d '{"eventType":"contract.approved","sourceSystem":"contract","resourceType":"contract","resourceId":"C-1001","occurredAt":"2026-06-08T00:55:00+09:00","idempotencyKey":"contract-C-1001-approved-v1","payload":{"contractId":"C-1001","customerId":"CUST-22","amount":120000,"currency":"JPY","approvedBy":"u-7","approvedAt":"2026-06-08T00:55:00+09:00"}}'
```

チェックリスト:
- [ ] 1回目 202 + `createdJobs[0].jobId`
- [ ] 同じbodyで2回目 200(duplicate=true)
- [ ] `amount` を変えて再送 409
- [ ] `/health` が 200

> 配送先(billing)の実体が無いと job は処理時に配送失敗になる。MVPの疎通確認は受信202までで十分。配送までは結合テスト(モック)で担保。

---

## 8. 管理画面(Next)

```bash
npm run web:dev    # → http://localhost:3000
```

チェックリスト:
- [ ] 未ログインで `/jobs` → `/login` にリダイレクト
- [ ] `ADMIN_EMAIL`/`ADMIN_PASSWORD` でログイン → `/jobs` 表示
- [ ] Jobs 一覧でフィルタ(status=fail等)が効く
- [ ] Job Detail で試行履歴・payload・trace表示
- [ ] owner で 手動再送/dead化 が動く(監査が残る)
- [ ] viewer ユーザーではボタン無効 + API直叩き403(ロール認可)
- [ ] ログアウトで `/login` に戻り、再アクセスでリダイレクト
- [ ] ブラウザDevToolsで `apoul_session` が httpOnly / localStorageにトークン無し

詰まりやすい点:
- `next/font` 取得にネット必要(初回ビルド時)。オフライン環境ならローカルフォントに差し替え。
- middleware が edge 実行。`SESSION_SECRET` が Next と middleware で同一env由来か確認。
- `APOUL_SERVICE_TOKEN` 未設定だと一覧/詳細が 401。手順5で設定。

---

## 9. ビルド(任意・本番前)

```bash
npm run typecheck && npm run test && npx next build
```

- [ ] tsc 0エラー / vitest 全green / next build 成功

---

## 10. 既知の未実装(本番前に対応)

- [ ] ログイン試行のレート制限/ロックアウト(Phase2)
- [ ] Webhook署名検証の本格化(Phase4)
- [ ] 自動Worker(常駐ポーラ/SQS)。現状は手動retryで同期処理(Phase2)
- [ ] transform_rules.input_schema のエンジン適用(現状は mapping の required で部分担保)
- [ ] 監査ログの改ざん検知(row_hash, Phase5)
- [ ] operationLog/payload のマスキングを表示・保存の全経路で適用(一部はコメントで方針のみ)

---

## 完了判定(このフェーズのDone)

上記 4〜9 のチェックがすべて green であれば、Phase 1 / MVP のローカル完成(M1: MVP疎通)とみなす。
次フェーズ(自動Worker・運用ダッシュボード・外部SaaS)へ進む条件を満たす。
