import type { FastifyReply, FastifyRequest } from "fastify";

export function requireScope(scope: string) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const scopes = req.authedClient?.scopes ?? [];
    if (!scopes.includes(scope)) {
      const { sendScopeDenied } = await import("../plugins/rateLimit");
      return sendScopeDenied(req, reply, scope);
    }
  };
}
