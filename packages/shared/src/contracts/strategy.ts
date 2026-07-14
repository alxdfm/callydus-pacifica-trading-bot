import { z } from "zod";
import { apiErrorSchema, isoDateTimeSchema } from "./common.js";

// ---------------------------------------------------------------------------
// Vocabulário v2: "strategy" de ponta a ponta. Este arquivo é a ÚNICA
// definição do draft e dos payloads de strategy — API e frontend importam
// daqui (fim do enum drift entre pacotes).
//
// O schema valida a FORMA do wire; validação semântica (regra referenciando
// indicador existente etc.) vive no materialize do servidor
// (activationBlockers) e na UX do builder.
// ---------------------------------------------------------------------------

export const marketSymbolSchema = z.enum(["BTC/USDC", "ETH/USDC", "SOL/USDC"]);
export const timeframeSchema = z.enum(["3m", "5m", "15m", "1h", "4h"]);

export const triggerScopeSchema = z.enum(["previousCandle", "currentCandle"]);

export const thresholdOperatorSchema = z.enum([
  "above",
  "below",
  "atOrAbove",
  "atOrBelow",
  "equal",
]);

export const crossOperatorSchema = z.enum(["crossesAbove", "crossesBelow"]);

export const triggerGroupTypeSchema = z.enum(["all", "any"]);

export const indicatorConfigSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("ema"),
    period: z.number().int().positive(),
    source: z.string().min(1).optional(),
  }),
  z.object({
    type: z.literal("rsi"),
    period: z.number().int().positive(),
  }),
  z.object({
    type: z.literal("atr"),
    period: z.number().int().positive(),
  }),
  z.object({
    type: z.literal("volume"),
  }),
  z.object({
    type: z.literal("sma"),
    source: z.string().min(1),
    period: z.number().int().positive(),
  }),
  z.object({
    type: z.literal("donchian"),
    period: z.number().int().positive(),
    band: z.enum(["upper", "lower", "middle"]),
  }),
  z.object({
    type: z.literal("adx"),
    period: z.number().int().positive(),
  }),
]);

export const triggerRuleSchema = z.union([
  z.object({
    scope: triggerScopeSchema,
    type: z.literal("threshold"),
    indicator: z.string().min(1),
    operator: thresholdOperatorSchema,
    value: z.number(),
    ref: z.undefined().optional(),
  }),
  z.object({
    scope: triggerScopeSchema,
    type: z.literal("threshold"),
    indicator: z.string().min(1),
    operator: thresholdOperatorSchema,
    ref: z.string().min(1),
    value: z.undefined().optional(),
  }),
  z.object({
    scope: triggerScopeSchema,
    type: z.literal("cross"),
    indicator: z.string().min(1),
    operator: crossOperatorSchema,
    ref: z.string().min(1),
    value: z.undefined().optional(),
  }),
  z.object({
    scope: triggerScopeSchema,
    type: z.literal("cross"),
    indicator: z.string().min(1),
    operator: crossOperatorSchema,
    value: z.number(),
    ref: z.undefined().optional(),
  }),
]);

export const entrySideSchema = z.object({
  enabled: z.boolean(),
  trigger: z.object({
    type: triggerGroupTypeSchema,
    rules: z.array(triggerRuleSchema).min(1),
  }),
});

export const stopLossConfigSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("static"),
    value: z.number().positive(),
    unit: z.literal("percent"),
  }),
  z.object({
    mode: z.literal("atr"),
    period: z.number().int().positive(),
    multiplier: z.number().positive(),
  }),
]);

export const takeProfitConfigSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("rr"),
    multiple: z.number().positive(),
  }),
]);

export const strategyDraftSchema = z
  .object({
    name: z.string().trim().min(1).max(80).default("YOUR Strategy"),
    symbol: marketSymbolSchema,
    timeframe: timeframeSchema,
    indicators: z.record(z.string().min(1), indicatorConfigSchema),
    entry: z.object({
      long: entrySideSchema,
      short: entrySideSchema,
    }),
    risk: z.object({
      stopLoss: stopLossConfigSchema,
      takeProfit: takeProfitConfigSchema.nullable(),
    }),
    positionSizeType: z.enum(["fixed_amount", "balance_percent"]),
    positionSizeValue: z.number().positive(),
  })
  .refine(
    (draft) => draft.entry.long.enabled || draft.entry.short.enabled,
    { message: "At least one entry side must be enabled.", path: ["entry"] },
  );

export const strategyStatusSchema = z.enum(["active", "paused", "stopped"]);

export const activationBlockerSchema = z.enum([
  "unsupported_position_size_type",
  "take_profit_missing",
  "stop_loss_missing",
  "no_entry_rules",
  "symbol_not_supported",
]);

// A visão do registro persistido — status vem daqui e SÓ daqui
// (botStatus/activePreset do v1 eram derivações paralelas da mesma verdade)
export const strategySchema = z.object({
  id: z.string().uuid(),
  status: strategyStatusSchema,
  draft: strategyDraftSchema,
  activationBlockers: z.array(activationBlockerSchema),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

// --- Comandos -------------------------------------------------------------
// Todo comando devolve a strategy atualizada: o cliente re-renderiza do
// registro real, sem objetos "command"/"activation" fictícios

export const saveStrategyRequestSchema = z.object({
  draft: strategyDraftSchema,
});

export const strategyResponseSchema = z.union([
  z.object({
    status: z.literal("ok"),
    strategy: strategySchema,
  }),
  apiErrorSchema,
]);

// --- Backtest ---------------------------------------------------------------

export const backtestRequestSchema = z.object({
  startTime: z.number().int().nonnegative(),
  endTime: z.number().int().positive(),
  initialCapitalUsd: z.number().positive(),
  leverage: z.number().positive(),
  feePercent: z.number().nonnegative(),
  slippagePercent: z.number().nonnegative(),
});

export const backtestSummarySchema = z.object({
  initialCapitalUsd: z.number(),
  endingEquityUsd: z.number(),
  endingHoldEquityUsd: z.number(),
  strategyReturnPercent: z.number(),
  holdReturnPercent: z.number(),
  alphaVsHoldPercent: z.number(),
  maxDrawdownPercent: z.number(),
  winRatePercent: z.number(),
  profitFactor: z.number(),
  totalTrades: z.number().int().nonnegative(),
  wins: z.number().int().nonnegative(),
  losses: z.number().int().nonnegative(),
});

export const equityPointSchema = z.object({
  time: z.string().min(1),
  equity: z.number(),
});

export const backtestResponseSchema = z.union([
  z.object({
    status: z.literal("ok"),
    summary: backtestSummarySchema,
    equityCurve: z.array(equityPointSchema),
    holdCurve: z.array(equityPointSchema),
    candlesUsed: z.number().int().nonnegative(),
  }),
  apiErrorSchema,
]);

export type MarketSymbol = z.infer<typeof marketSymbolSchema>;
export type Timeframe = z.infer<typeof timeframeSchema>;
export type IndicatorConfig = z.infer<typeof indicatorConfigSchema>;
export type TriggerRule = z.infer<typeof triggerRuleSchema>;
export type StrategyDraft = z.infer<typeof strategyDraftSchema>;
export type StrategyRecord = z.infer<typeof strategySchema>;
export type StrategyResponse = z.infer<typeof strategyResponseSchema>;
export type BacktestRequest = z.infer<typeof backtestRequestSchema>;
export type BacktestResponse = z.infer<typeof backtestResponseSchema>;
