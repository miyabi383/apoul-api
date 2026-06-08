# @apoul/auth

認証・認可（Phase 2 以降で `src/server/auth/` から抽出）。

## TODO

- [ ] apiKey.ts / scope.ts / ipAllowlist.ts を移行
- [ ] session.ts（Next.js 管理画面用）
- [ ] Phase 2: production で `AUTH_DISABLED=true` 起動禁止

```typescript
// TODO Phase 2-1
if (process.env.NODE_ENV === "production" && process.env.AUTH_DISABLED === "true") {
  throw new Error("AUTH_DISABLED=true is not allowed in production");
}
```
