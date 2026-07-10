import { z } from "zod";
import { apiErrorSchema } from "./common.js";
import { marketSymbolSchema } from "./strategy.js";

// ---------------------------------------------------------------------------
// GET /api/v2/markets — metadados reais dos mercados suportados (proxy do
// getMarketInfo da Pacifica). Fecha o gap do v1 em que marketInfo: [] fazia
// o builder calcular backtest com leverage 1 silenciosamente.
// ---------------------------------------------------------------------------

export const marketSchema = z.object({
  // A Pacifica retorna o símbolo BASE ("SOL"); o endpoint mapeia base→par
  // ("SOL/USDC") antes de responder — o parse falha se esquecer
  symbol: marketSymbolSchema,
  maxLeverage: z.number().positive(),
  tickSize: z.string().min(1),
  lotSize: z.string().min(1),
  minOrderSize: z.string().min(1),
});

export const marketsResponseSchema = z.union([
  z.object({
    status: z.literal("ok"),
    markets: z.array(marketSchema),
  }),
  apiErrorSchema,
]);

export type Market = z.infer<typeof marketSchema>;
export type MarketsResponse = z.infer<typeof marketsResponseSchema>;
