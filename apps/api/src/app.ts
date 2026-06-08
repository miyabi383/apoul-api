// src/server/app.ts
// Fastify 組み立て。認証不要の /health と、APIキー認証必須の /v1/* グループ。
// 注: Webhook署名検証(Phase4)では生ボディが要るため、別途 rawBody 保持の設定を足す。

import Fastify from "fastify";
import { requestContextHook } from "./lib/requestContext";
import { apiKeyAuth } from "./auth/authenticate";
import { registerOpenApi } from "./plugins/openapi";
import { authRoutes } from "./routes/auth";
import { auditLogRoutes } from "./routes/auditLogs";
import { clientsRoutes } from "./routes/clients";
import { eventsRoutes } from "./routes/events";
import { healthCheckRoutes } from "./routes/health";
import { jobsRoutes } from "./routes/jobs";
import { mapOverviewRoutes } from "./routes/mapOverview";
import { opsRoutes } from "./routes/ops";
import { progressRoutes } from "./routes/progress";
import { routesCrudRoutes } from "./routes/routesCrud";
import { systemsRoutes } from "./routes/systems";

export function buildApp() {
  const app = Fastify({
    logger: true,
    bodyLimit: 1_000_000, // 1MB上限(入力検証の一環)
  });

  app.addHook("onRequest", requestContextHook);

  void registerOpenApi(app);

  // 認証不要・軽量(LB/監視用)
  app.get("/health", async () => ({ status: "ok", time: new Date().toISOString() }));

  // 認証不要・公開(人間ログイン)。レート制限は plugins/rateLimit.ts
  app.register(authRoutes);

  // APIキー認証必須グループ
  app.register(async (api) => {
    api.addHook("preHandler", apiKeyAuth);
    await eventsRoutes(api);
    await systemsRoutes(api);
    await clientsRoutes(api);
    await jobsRoutes(api);
    await healthCheckRoutes(api);
    await opsRoutes(api);
    await mapOverviewRoutes(api);
    await auditLogRoutes(api);
    await progressRoutes(api);
    await routesCrudRoutes(api);
  });

  return app;
}
