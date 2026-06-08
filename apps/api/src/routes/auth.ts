import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { registerLoginRateLimit } from "../plugins/rateLimit";
import { loginUser } from "../services/login";
import { writeAudit } from "../services/audit";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function authRoutes(app: FastifyInstance) {
  await registerLoginRateLimit(app);

  app.post(
    "/v1/auth/login",
    {
      schema: {
        tags: ["auth"],
        summary: "管理ユーザー login",
        body: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string" },
          },
        },
      },
      config: {
        rateLimit: {
          max: Number(process.env.LOGIN_RATE_LIMIT_MAX ?? 10),
          timeWindow: Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MS ?? 60_000),
        },
      },
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const parsed = LoginSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: { code: "VALIDATION_FAILED", message: "invalid body", requestId: req.requestId ?? null },
        });
      }

      const user = await loginUser(parsed.data.email, parsed.data.password);
      if (!user) {
        await writeAudit({
          actorLabel: parsed.data.email,
          action: "auth.login_failed",
          targetType: "user",
          targetId: parsed.data.email,
          ip: req.ip,
          reason: "invalid credentials",
        });
        return reply.code(401).send({
          error: { code: "INVALID_CREDENTIALS", message: "invalid email or password", requestId: req.requestId ?? null },
        });
      }

      await writeAudit({
        actorLabel: user.email,
        action: "auth.login_success",
        targetType: "user",
        targetId: user.id,
        ip: req.ip,
        meta: { role: user.role },
      });

      return reply.send({ user });
    },
  );
}
