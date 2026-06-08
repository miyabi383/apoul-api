import { z } from "zod";

export const EnvelopeSchema = z.object({
  eventType: z.string().min(1),
  sourceSystem: z.string().min(1),
  resourceType: z.string().min(1),
  resourceId: z.string().min(1),
  occurredAt: z.string().datetime({ offset: true }),
  idempotencyKey: z.string().min(1).max(256),
  payload: z.record(z.unknown()),
});

export type Envelope = z.infer<typeof EnvelopeSchema>;
