# 無料枠での本番デプロイ

APOUL API SYSTEM を **0 円** で公開する構成です。

## 最短ルート（推奨・約 5 分）

フロントだけではログイン・ジョブ等は**一切動きません**。API + DB が必須です。

### 事前準備（各 1 回）

1. [Neon](https://console.neon.tech/app/settings/api-keys) で API キー作成
2. [Render](https://dashboard.render.com/u/settings#api-keys) で API キー作成
3. Render Dashboard → **Account Settings → GitHub** で `miyabi383/apoul-api` を連携

### 一括セットアップ

```bash
NEON_API_KEY=neon_xxx RENDER_API_KEY=rnd_xxx pnpm provision:prod
```

このコマンドが自動で行うこと:

| 順序 | 処理 |
|------|------|
| 1 | Neon に PostgreSQL 作成 |
| 2 | ローカルから migrate + seed + トークン発行 |
| 3 | Render に API + Worker（1 コンテナ）デプロイ |
| 4 | Vercel 環境変数設定 + 再デプロイ |

完了後: https://web-blond-nine-25.vercel.app/login でログイン可能。

---

## 構成（従来版: API / Worker 分割）

| コンポーネント | サービス | 無料枠 |
|----------------|----------|--------|
| PostgreSQL | [Neon](https://neon.tech) | 0.5 GB / プロジェクト |
| API (Fastify) | [Render](https://render.com) Web Service | 750 時間/月 |
| Worker | Render Background Worker | 750 時間/月（共有） |
| 管理画面 (Next.js) | [Vercel](https://vercel.com) Hobby | 個人利用無料 |
| CI | GitHub Actions | 公開 repo 無料 |

> **注意:** Render 無料枠は 15 分アイドルでスリープします。初回アクセスに 30〜60 秒かかることがあります。

---

## アーキテクチャ

```
[Vercel] 管理画面 (Next.js)
    │  Server Component → Bearer token
    ▼
[Render] API :4100  ──► [Neon] PostgreSQL
    │
    ▼ enqueue
[Render] Worker (Job ポーリング)
```

---

## 1. Neon（PostgreSQL）

1. [neon.tech](https://neon.tech) でアカウント作成
2. **New Project** → リージョン `AWS ap-southeast-1 (Singapore)` 推奨
3. **Connection string** をコピー（Pooled 推奨）
4. 末尾に `?sslmode=require` があることを確認

```
DATABASE_URL=postgresql://user:pass@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

---

## 2. GitHub に push

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/<user>/apoul-api.git
git push -u origin main
```

---

## 3. Render（API + Worker）

1. [render.com](https://render.com) → **New** → **Blueprint**
2. GitHub リポジトリを接続
3. `render.yaml` を検出 → **Apply**

### 手動で設定する環境変数

| 変数 | 値 |
|------|-----|
| `DATABASE_URL` | Neon の接続文字列 |
| `ADMIN_EMAIL` | 管理ログイン用メール |
| `ADMIN_PASSWORD` | 強力なパスワード（12 文字以上） |
| `APOUL_SERVICE_TOKEN` | 後述の `prod:setup` で発行（仮で空でも可） |

`SESSION_SECRET` は Render が自動生成します。

### 初回セットアップ（Render Shell）

API サービス → **Shell** で:

```bash
pnpm prod:setup
```

表示された `APOUL_SERVICE_TOKEN` を:
- Render **apoul-api** の環境変数
- Vercel（次のステップ）の環境変数

に設定して再デプロイ。

### 動作確認

```
https://<apoul-api>.onrender.com/health
→ {"status":"ok",...}

https://<apoul-api>.onrender.com/docs
→ Swagger UI
```

---

## 4. Vercel（管理画面）

1. [vercel.com](https://vercel.com) → **Add New Project**
2. 同じ GitHub リポジトリを import
3. **Root Directory** → `apps/web`
4. Framework: Next.js（自動検出）

### 環境変数

| 変数 | 値 |
|------|-----|
| `NODE_ENV` | `production` |
| `AUTH_DISABLED` | `false` |
| `APOUL_API_URL` | `https://<apoul-api>.onrender.com` |
| `APOUL_SERVICE_TOKEN` | `prod:setup` で発行したトークン |
| `SESSION_SECRET` | Render と **同じ値** |
| `ADMIN_EMAIL` | Render と同じ |
| `ADMIN_PASSWORD` | Render と同じ |

5. **Deploy**

### ログイン

`https://<your-app>.vercel.app/login` → `ADMIN_EMAIL` / `ADMIN_PASSWORD`

---

## 5. 本番チェックリスト

- [ ] `AUTH_DISABLED=false`（Vercel / Render 両方）
- [ ] `ALLOW_LOCAL_DISPATCH=false`（Render）
- [ ] `SESSION_SECRET` 32 文字以上
- [ ] `APOUL_SERVICE_TOKEN` が Vercel と Render API で一致
- [ ] Worker が Render で **Running**
- [ ] Neon DB に migrate 済み（API 起動時に自動 `db:deploy`）
- [ ] `pnpm prod:setup` 実行済み（seed + トークン）

---

## 6. ローカルで本番 Docker を試す

```bash
# Neon の DATABASE_URL を .env に設定
docker build -f docker/Dockerfile.api -t apoul-api .
docker run --env-file .env -p 4100:4100 apoul-api
```

---

## 7. CI（GitHub Actions）

`main` への push / PR で自動実行:

- typecheck
- test（Postgres service container）
- web build
- OpenAPI 生成

---

## 8. 制限・コスト

| 項目 | 無料枠の制限 |
|------|-------------|
| Render スリープ | 15 分アイドルで停止 → コールドスタート |
| Render 時間 | 750 時間/月（API + Worker で共有） |
| Neon ストレージ | 0.5 GB |
| Neon 計算 | 191.9 時間/月 |
| Vercel | 帯域・ビルド分数に上限（Hobby） |

常時起動が必要な場合は Render Starter（$7/月）または Fly.io を検討してください。

---

## 9. トラブルシュート

| 症状 | 対処 |
|------|------|
| 管理画面 `UNAUTHORIZED` | `pnpm prod:setup` → トークンを Vercel に再設定 |
| ジョブが pending のまま | Render Worker が Running か確認 |
| API 起動失敗 `AUTH_DISABLED` | 本番で `AUTH_DISABLED=true` は禁止 |
| DB 接続エラー | Neon URL に `sslmode=require` を付与 |

---

## 関連ファイル

| ファイル | 用途 |
|----------|------|
| `render.yaml` | Render Blueprint |
| `docker/Dockerfile.api` | API 本番イメージ |
| `docker/Dockerfile.worker` | Worker 本番イメージ |
| `apps/web/vercel.json` | Vercel monorepo ビルド |
| `.github/workflows/ci.yml` | CI |
| `scripts/prodSetup.ts` | 初回 seed + トークン |
