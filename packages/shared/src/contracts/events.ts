import { z } from "zod";
import { apiErrorSchema, isoDateTimeSchema } from "./common.js";

// ---------------------------------------------------------------------------
// GET /api/v2/events — eventos operacionais reais do worker (enum espelha o
// event_type do banco; o v1 mapeava tudo para "runtime_reconciliation")
// ---------------------------------------------------------------------------

export const eventTypeSchema = z.enum([
  "signal_evaluated",
  "order_submitted",
  "order_failed",
  "trade_opened",
  "trade_closed",
  "strategy_activated",
  "strategy_paused",
  "strategy_stopped",
  "reconciliation",
  "error",
]);

export const eventSchema = z.object({
  id: z.string().uuid(),
  type: eventTypeSchema,
  payload: z.unknown().nullable(),
  createdAt: isoDateTimeSchema,
});

export const eventsResponseSchema = z.union([
  z.object({
    status: z.literal("ok"),
    events: z.array(eventSchema),
  }),
  apiErrorSchema,
]);

export type OperationalEvent = z.infer<typeof eventSchema>;
export type EventsResponse = z.infer<typeof eventsResponseSchema>;
