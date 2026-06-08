import type { FastifyInstance } from "fastify";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";

export async function registerOpenApi(app: FastifyInstance): Promise<void> {
  await app.register(swagger, {
    openapi: {
      openapi: "3.1.0",
      info: {
        title: "APOUL API",
        description: "イベント連携ハブ — Phase 4 OpenAPI",
        version: "0.1.0",
      },
      servers: [{ url: "http://localhost:4100", description: "local" }],
      tags: [
        { name: "events", description: "イベント受信" },
        { name: "jobs", description: "ジョブ管理" },
        { name: "systems", description: "システム" },
        { name: "auth", description: "認証" },
      ],
      components: {
        securitySchemes: {
          bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "API Key" },
        },
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: { docExpansion: "list", deepLinking: true },
  });
}

/** buildApp 外から OpenAPI JSON を取得するための export */
export async function exportOpenApiDocument(app: FastifyInstance): Promise<object> {
  await app.ready();
  return app.swagger();
}
