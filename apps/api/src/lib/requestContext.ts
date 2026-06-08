// src/server/lib/requestContext.ts

import type { FastifyReply, FastifyRequest } from "fastify";
import { randomUUID } from "node:crypto";

export type AuthedClient = {
  clientId: bigint;
  clientRef: string;
  systemId: bigint;
  systemCode: string;
  scopes: string[];
};

declare module "fastify" {
  interface FastifyRequest {
    requestId: string;
    authedClient?: AuthedClient;
  }
}

export async function requestContextHook(req: FastifyRequest, _reply: FastifyReply) {
  const header = req.headers["x-request-id"];
  req.requestId = typeof header === "string" && header.length > 0 ? header : randomUUID();
}
