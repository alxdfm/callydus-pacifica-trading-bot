import { z } from "zod";

// ---------------------------------------------------------------------------
// Envelope de erro único para toda a API v2.
// `code` é string livre (não enum): códigos novos no servidor não podem
// derrubar o parse do cliente — a UI faz switch nos códigos que conhece.
// ---------------------------------------------------------------------------

export const apiErrorSchema = z.object({
  status: z.literal("error"),
  code: z.string().min(1),
  message: z.string().min(1),
  retryable: z.boolean(),
});

export type ApiError = z.infer<typeof apiErrorSchema>;

export const isoDateTimeSchema = z.string().datetime();
