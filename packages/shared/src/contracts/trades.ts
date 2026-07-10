import { z } from "zod";
import { apiErrorSchema, isoDateTimeSchema } from "./common.js";
import { marketSymbolSchema } from "./strategy.js";

// ---------------------------------------------------------------------------
// Trades v2: os status são os REAIS do banco (open/close_requested/closing/
// closed) — o v1 inventava um tradeStatus próprio e valores fictícios
// (capitalAllocated: 0, currentPrice = entryPrice). Aqui só existe o que o
// worker de fato escreve.
// ---------------------------------------------------------------------------

export const tradeSideSchema = z.enum(["long", "short"]);

export const tradeStatusSchema = z.enum([
  "open",
  "close_requested",
  "closing",
  "closed",
]);

export const closeReasonSchema = z.enum([
  "take_profit",
  "stop_loss",
  "manual",
  "system",
  "error",
]);

export const tradeSchema = z.object({
  id: z.string().uuid(),
  strategyId: z.string().uuid(),
  symbol: marketSymbolSchema,
  side: tradeSideSchema,
  status: tradeStatusSchema,
  amount: z.number().positive(),
  entryPrice: z.number().positive(),
  exitPrice: z.number().positive().nullable(),
  stopLossPrice: z.number().positive().nullable(),
  takeProfitPrice: z.number().positive().nullable(),
  closeReason: closeReasonSchema.nullable(),
  realizedPnl: z.number().nullable(),
  openedAt: isoDateTimeSchema,
  closedAt: isoDateTimeSchema.nullable(),
});

// closedTrades cresce sem teto — GET /api/v2/trades aceita ?limit (máximo de
// closedTrades retornados) com este default
export const TRADES_DEFAULT_CLOSED_LIMIT = 50;

export const tradesResponseSchema = z.union([
  z.object({
    status: z.literal("ok"),
    openTrades: z.array(tradeSchema),
    closedTrades: z.array(tradeSchema),
  }),
  apiErrorSchema,
]);

export const closeTradeResponseSchema = z.union([
  z.object({
    status: z.literal("ok"),
    trade: tradeSchema,
  }),
  apiErrorSchema,
]);

export type Trade = z.infer<typeof tradeSchema>;
export type TradesResponse = z.infer<typeof tradesResponseSchema>;
export type CloseTradeResponse = z.infer<typeof closeTradeResponseSchema>;
