import {
  calculateAdxSeries,
  calculateAtrSeries,
  calculateDonchianSeries,
  calculateVolumeProfileSeries,
  calculateEmaSeries,
  calculateRsiSeries,
  calculateSmaSeries,
  createIndicatorNaNSeries,
} from "./indicators.js";

// ---------------------------------------------------------------------------
// Local type definitions (replaces @pacifica/contracts imports)
// ---------------------------------------------------------------------------

export type TradeSide = "long" | "short";

export type MarketCandleInterval =
  | "1m"
  | "3m"
  | "5m"
  | "15m"
  | "30m"
  | "1h"
  | "2h"
  | "4h"
  | "6h"
  | "12h"
  | "1d";

export type MarketCandle = {
  symbol: string;
  interval: string;
  openTime: number;
  closeTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type PresetSymbol = "BTC/USDC" | "ETH/USDC" | "SOL/USDC";

export type YourStrategyActivationBlocker =
  | "unsupported_position_size_type"
  | "take_profit_missing"
  | "stop_loss_missing"
  | "no_entry_rules"
  | "symbol_not_supported"
  | "invalid_indicator_source";

type IndicatorEmaConfig = {
  type: "ema";
  period: number;
  source?: string;
};

type IndicatorRsiConfig = {
  type: "rsi";
  period: number;
};

type IndicatorAtrConfig = {
  type: "atr";
  period: number;
};

type IndicatorVolumeConfig = {
  type: "volume";
};

type IndicatorSmaConfig = {
  type: "sma";
  source: string;
  period: number;
};

type IndicatorDonchianConfig = {
  type: "donchian";
  period: number;
  band: "upper" | "lower" | "middle";
};

type IndicatorAdxConfig = {
  type: "adx";
  period: number;
};

type IndicatorVolumeProfileConfig = {
  type: "volumeProfile";
  period: number;
  level: "poc" | "vah" | "val";
};

type IndicatorConfig =
  | IndicatorEmaConfig
  | IndicatorRsiConfig
  | IndicatorAtrConfig
  | IndicatorVolumeConfig
  | IndicatorSmaConfig
  | IndicatorDonchianConfig
  | IndicatorAdxConfig
  | IndicatorVolumeProfileConfig;

type TriggerScope = "previousCandle" | "currentCandle";
type ThresholdOperator = "above" | "below" | "atOrAbove" | "atOrBelow" | "equal";
type CrossOperator = "crossesAbove" | "crossesBelow";

type ThresholdValueRule = {
  scope: TriggerScope;
  type: "threshold";
  indicator: string;
  operator: ThresholdOperator;
  value: number;
  ref?: undefined;
};

type ThresholdReferenceRule = {
  scope: TriggerScope;
  type: "threshold";
  indicator: string;
  operator: ThresholdOperator;
  ref: string;
  value?: undefined;
};

type CrossReferenceRule = {
  scope: TriggerScope;
  type: "cross";
  indicator: string;
  operator: CrossOperator;
  ref: string;
  value?: undefined;
};

type CrossValueRule = {
  scope: TriggerScope;
  type: "cross";
  indicator: string;
  operator: CrossOperator;
  value: number;
  ref?: undefined;
};

export type PresetTriggerRule =
  | ThresholdValueRule
  | ThresholdReferenceRule
  | CrossReferenceRule
  | CrossValueRule;

type TriggerGroup = {
  type: "all" | "any";
  rules: PresetTriggerRule[];
};

type EntrySide = {
  enabled: boolean;
  trigger: TriggerGroup;
};

type StopLossStaticConfig = {
  mode: "static";
  value: number;
  unit: "percent";
};

type StopLossAtrConfig = {
  mode: "atr";
  period: number;
  multiplier: number;
};

/**
 * Stop anchored on the value-area edge: longs stop below VAL, shorts above VAH.
 * The distance is ASYMMETRIC (each side has its own) and may not exist at all —
 * price inside the value area has no valid stop on that side, and the trade is
 * skipped. The RR take profit inherits it, so this mode moves BOTH ends.
 */
type StopLossVolumeProfileConfig = {
  mode: "volumeProfile";
  period: number;
  /** Slack beyond the level, as a % of the entry price. */
  bufferPercent: number;
};

type StopLossConfig =
  | StopLossStaticConfig
  | StopLossAtrConfig
  | StopLossVolumeProfileConfig;

type TakeProfitRrConfig = {
  mode: "rr";
  multiple: number;
};

type TakeProfitConfig = TakeProfitRrConfig;

export type PresetTechnicalContract = {
  name: string;
  version: number;
  timeframe: MarketCandleInterval;
  symbol: string;
  indicators: Record<string, IndicatorConfig>;
  entry: {
    long: EntrySide;
    short: EntrySide;
  };
  risk: {
    stopLoss: StopLossConfig;
    takeProfit: TakeProfitConfig;
  };
  execution: {
    positionSize: {
      type: "fixedPercent";
      value: number;
    };
    onePositionPerSymbol: boolean;
    manualCloseAllowed: boolean;
    closeOppositePositionOnSignal: boolean;
  };
};

export type PresetRuleEvaluation = {
  direction: TradeSide;
  ruleIndex: number;
  scope: TriggerScope;
  type: "threshold" | "cross";
  indicator: string;
  operator: string;
  ref: string | null;
  value: number | null;
  satisfied: boolean;
  explanation: string;
};

export type PresetSignal = "none" | "long" | "short";

export type PresetEditableConfig = {
  symbol: PresetSymbol;
  positionSizeType: "fixed_amount" | "balance_percent";
  positionSizeValue: number;
  longEnabled: boolean;
  shortEnabled: boolean;
};

export type YourStrategyDraft = {
  name: string;
  // O engine roda em qualquer intervalo; quem restringe o que é ofertável é o
  // `timeframeSchema` do contrato. Repetir a lista aqui só criava um tipo que
  // mentia em silêncio quando o enum crescia (a rota faz cast de jsonb, então
  // o typecheck não pegava)
  timeframe: MarketCandleInterval;
  symbol: PresetSymbol;
  indicators: Record<string, IndicatorConfig>;
  entry: {
    long: EntrySide;
    short: EntrySide;
  };
  risk: {
    stopLoss: StopLossConfig;
    takeProfit: TakeProfitConfig | null;
  };
  positionSizeType: "fixed_amount" | "balance_percent";
  positionSizeValue: number;
};

// ---------------------------------------------------------------------------
// Exported types
// ---------------------------------------------------------------------------

export class EquityDepletedError extends Error {
  constructor() {
    super(
      "The strategy's equity was fully depleted during the simulation. Try a longer backtest period, a lower position size, or review your entry and exit rules.",
    );
    this.name = "EquityDepletedError";
  }
}

type IndicatorSeries = number[];

type IndicatorSnapshot = {
  previous: number | null;
  current: number | null;
};

// O engine lê exatamente estes dois pontos de cada série (scopes currentCandle e
// previousCandle) — nada olha mais fundo. Indicadores caros por posição (volume
// profile) só calculam essa cauda. Um scope novo que leia mais atrás precisa
// subir este número JUNTO, senão a série vem NaN e a regra morre em silêncio.
const INDICATOR_TAIL_POSITIONS = 2;

export type EvaluatedPresetSignal = {
  signal: PresetSignal;
  longSignal: boolean;
  shortSignal: boolean;
  indicators: Record<string, IndicatorSnapshot>;
  longRuleEvaluations: PresetRuleEvaluation[];
  shortRuleEvaluations: PresetRuleEvaluation[];
};

export type PresetRiskPlan = {
  side: "long" | "short";
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  riskDistance: number;
};

export type SimulatedPresetTrade = {
  id: string;
  side: TradeSide;
  openedAt: string;
  closedAt: string;
  entryPrice: number;
  exitPrice: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  quantity: number;
  capitalAllocated: number;
  leverageUsed: number;
  entryFeeUsd: number;
  exitFeeUsd: number;
  realizedPnl: number;
  realizedPnlPercentOnCapital: number;
  closeReason: "take_profit" | "stop_loss" | "signal_end_of_period";
};

export type SimulatedPresetCurvePoint = {
  time: string;
  equity: number;
};

export type SimulatedPresetDrawdownPoint = {
  time: string;
  drawdownPercent: number;
};

export type SimulatedPresetSummary = {
  initialCapitalUsd: number;
  endingEquityUsd: number;
  endingHoldEquityUsd: number;
  strategyReturnPercent: number;
  holdReturnPercent: number;
  alphaVsHoldPercent: number;
  maxDrawdownPercent: number;
  winRatePercent: number;
  profitFactor: number;
  totalTrades: number;
  wins: number;
  losses: number;
};

export type SimulatePresetBacktestInput = {
  technicalContract: PresetTechnicalContract;
  candles: MarketCandle[];
  initialCapitalUsd: number;
  leverage?: number;
  feePercent?: number;
  slippagePercent?: number;
  /**
   * Start of the period being measured. Candles before it are history only:
   * they feed the indicators but open no trades and are not priced into the
   * hold benchmark. Defaults to the first tradable candle (warm-up = lookback).
   */
  tradingStartTime?: number;
};

export type SimulatePresetBacktestResult = {
  summary: SimulatedPresetSummary;
  equityCurve: SimulatedPresetCurvePoint[];
  holdCurve: SimulatedPresetCurvePoint[];
  drawdownCurve: SimulatedPresetDrawdownPoint[];
  trades: SimulatedPresetTrade[];
};

export type MaterializedYourStrategy = {
  technicalContract: PresetTechnicalContract | null;
  activationBlockers: YourStrategyActivationBlocker[];
};

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

/**
 * Candles the simulator keeps in its evaluation window, mirroring the worker's
 * CandleBuffer capacity. Callers must warm up at least this many candles before
 * the measured period, otherwise the backtest evaluates its first candles on a
 * shorter history than the live bot has.
 */
export const EVALUATION_WINDOW_CANDLES = 300;

// ---------------------------------------------------------------------------
// Public functions
// ---------------------------------------------------------------------------

export function evaluateSignal(
  technicalContract: PresetTechnicalContract,
  candles: MarketCandle[],
): EvaluatedPresetSignal {
  const indicatorSeries = buildIndicatorSeriesMap(
    technicalContract.indicators,
    candles,
  );

  const indicators = Object.keys(technicalContract.indicators).reduce<
    Record<string, IndicatorSnapshot>
  >((result, indicatorName) => {
    result[indicatorName] = {
      previous: toNullableFinite(indicatorSeries[indicatorName]?.at(-2)),
      current: toNullableFinite(indicatorSeries[indicatorName]?.at(-1)),
    };
    return result;
  }, {});

  const longRuleEvaluations = technicalContract.entry.long.enabled
    ? evaluateRuleGroup(
        "long",
        technicalContract.entry.long.trigger.type,
        technicalContract.entry.long.trigger.rules,
        indicatorSeries,
      )
    : [];
  const shortRuleEvaluations = technicalContract.entry.short.enabled
    ? evaluateRuleGroup(
        "short",
        technicalContract.entry.short.trigger.type,
        technicalContract.entry.short.trigger.rules,
        indicatorSeries,
      )
    : [];

  const longSignal =
    technicalContract.entry.long.enabled &&
    didRuleGroupPass(
      technicalContract.entry.long.trigger.type,
      longRuleEvaluations,
    );
  const shortSignal =
    technicalContract.entry.short.enabled &&
    didRuleGroupPass(
      technicalContract.entry.short.trigger.type,
      shortRuleEvaluations,
    );

  return {
    signal: longSignal === shortSignal ? "none" : longSignal ? "long" : "short",
    longSignal,
    shortSignal,
    indicators,
    longRuleEvaluations,
    shortRuleEvaluations,
  };
}

/**
 * A side comes back `null` when the config admits no valid stop there — with a
 * value-area stop that happens whenever price sits inside the value area, which
 * is a normal market state, not an error. Callers must skip the trade.
 */
export function buildRiskPlans(
  technicalContract: PresetTechnicalContract,
  indicators: Record<string, { previous: number | null; current: number | null }>,
  entryPrice: number,
) {
  const distances = resolveRiskDistances(
    technicalContract,
    indicators,
    entryPrice,
  );
  const rrMultiple = technicalContract.risk.takeProfit.multiple;

  return {
    long:
      distances.long === null
        ? null
        : {
            side: "long" as const,
            entryPrice,
            stopLossPrice: entryPrice - distances.long,
            takeProfitPrice: entryPrice + distances.long * rrMultiple,
            riskDistance: distances.long,
          },
    short:
      distances.short === null
        ? null
        : {
            side: "short" as const,
            entryPrice,
            stopLossPrice: entryPrice + distances.short,
            takeProfitPrice: entryPrice - distances.short * rrMultiple,
            riskDistance: distances.short,
          },
  };
}

export function materializeEffectivePresetContract(
  baseContract: PresetTechnicalContract,
  editableConfig: PresetEditableConfig,
): PresetTechnicalContract {
  return {
    ...baseContract,
    symbol: editableConfig.symbol,
    entry: {
      ...baseContract.entry,
      long: {
        ...baseContract.entry.long,
        enabled: editableConfig.longEnabled,
      },
      short: {
        ...baseContract.entry.short,
        enabled: editableConfig.shortEnabled,
      },
    },
    execution: {
      ...baseContract.execution,
      positionSize: {
        ...baseContract.execution.positionSize,
        value: editableConfig.positionSizeValue,
      },
    },
  };
}

export function materializeYourStrategyTechnicalContract(
  draft: YourStrategyDraft,
): MaterializedYourStrategy {
  const activationBlockers: YourStrategyActivationBlocker[] = [];
  const takeProfit = draft.risk.takeProfit;
  const indicators = ensureRiskSupportIndicators(draft);

  if (draft.positionSizeType !== "balance_percent") {
    activationBlockers.push("unsupported_position_size_type");
  }

  if (takeProfit === null) {
    activationBlockers.push("take_profit_missing");
  }

  if (hasInvalidIndicatorSource(indicators)) {
    activationBlockers.push("invalid_indicator_source");
  }

  if (activationBlockers.length > 0) {
    return {
      technicalContract: null,
      activationBlockers,
    };
  }

  return {
    technicalContract: {
      name: draft.name,
      version: 1,
      timeframe: draft.timeframe,
      symbol: draft.symbol,
      indicators,
      entry: draft.entry,
      risk: {
        stopLoss: draft.risk.stopLoss,
        takeProfit:
          takeProfit ?? {
            mode: "rr",
            multiple: 99,
          },
      },
      execution: {
        positionSize: {
          type: "fixedPercent",
          value: draft.positionSizeValue,
        },
        onePositionPerSymbol: true,
        manualCloseAllowed: true,
        closeOppositePositionOnSignal: false,
      },
    },
    activationBlockers,
  };
}

export function simulatePresetBacktest(
  input: SimulatePresetBacktestInput,
): SimulatePresetBacktestResult {
  const leverage = input.leverage ?? 1;
  const feeRate = (input.feePercent ?? 0) / 100;
  const slippageRate = (input.slippagePercent ?? 0) / 100;
  const requiredPeriod = getRequiredPeriod(input.technicalContract);
  const trades: SimulatedPresetTrade[] = [];
  const equityCurve: SimulatedPresetCurvePoint[] = [];
  const holdCurve: SimulatedPresetCurvePoint[] = [];
  const drawdownCurve: SimulatedPresetDrawdownPoint[] = [];
  let equity = input.initialCapitalUsd;
  let peakEquity = input.initialCapitalUsd;

  const startIndex = resolveTradingStartIndex(
    input.candles,
    requiredPeriod,
    input.tradingStartTime,
  );
  const firstTradableCandle = input.candles[startIndex];

  if (!firstTradableCandle) {
    return {
      summary: createSimulationSummary({
        initialCapitalUsd: input.initialCapitalUsd,
        endingEquityUsd: equity,
        endingHoldEquityUsd: input.initialCapitalUsd,
        trades,
        maxDrawdownPercent: 0,
      }),
      equityCurve,
      holdCurve,
      drawdownCurve,
      trades,
    };
  }

  const holdUnits = input.initialCapitalUsd / firstTradableCandle.open;
  let openPosition: {
    id: string;
    side: TradeSide;
    entryPrice: number;
    stopLossPrice: number;
    takeProfitPrice: number;
    quantity: number;
    capitalAllocated: number;
    leverageUsed: number;
    entryFeeUsd: number;
    openedAt: string;
  } | null = null;

  for (let index = startIndex; index < input.candles.length; index += 1) {
    const currentCandle = input.candles[index];

    if (!currentCandle) {
      continue;
    }

    if (openPosition) {
      const closedTrade = maybeClosePosition({
        candle: currentCandle,
        position: openPosition,
        feeRate,
        slippageRate,
      });

      if (closedTrade) {
        trades.push(closedTrade.trade);
        equity += closedTrade.trade.realizedPnl;
        openPosition = null;
      }
    }

    if (!openPosition) {
      const nextCandle = input.candles[index + 1];
      // Janela limitada espelhando o CandleBuffer do worker: é como o bot
      // avalia ao vivo, e a janela crescente era O(n²) — com RSI em 14k candles
      // estourava o timeout de 29s da Lambda
      const evaluationWindow = Math.max(
        requiredPeriod + 5,
        EVALUATION_WINDOW_CANDLES,
      );
      const candleWindow = input.candles.slice(
        Math.max(0, index + 1 - evaluationWindow),
        index + 1,
      );
      const evaluation = evaluateSignal(input.technicalContract, candleWindow);

      if (evaluation.signal !== "none" && nextCandle) {
        const capitalAllocated = resolveCapitalAllocation(
          input.technicalContract,
          equity,
        );

        if (Math.round(capitalAllocated * 100) / 100 <= 0) {
          throw new EquityDepletedError();
        }

        const notionalUsd = capitalAllocated * leverage;
        const entryPrice = applyAdverseSlippage(
          nextCandle.open,
          evaluation.signal,
          slippageRate,
          "entry",
        );
        const riskPlans = buildRiskPlans(
          input.technicalContract,
          evaluation.indicators,
          entryPrice,
        );
        const riskPlan =
          evaluation.signal === "long" ? riskPlans.long : riskPlans.short;

        // Sem stop válido não há trade — o bot ao vivo pula igual (invariante 3).
        // Com stop na value area isso ocorre quando o preço está DENTRO dela, e
        // o backtest tem que refletir essa recusa, não inventar uma proteção.
        if (riskPlan) {
          const quantity = notionalUsd / entryPrice;
          const entryFeeUsd = notionalUsd * feeRate;

          openPosition = {
            id: `${currentCandle.closeTime}-${evaluation.signal}`,
            side: evaluation.signal,
            entryPrice,
            stopLossPrice: riskPlan.stopLossPrice,
            takeProfitPrice: riskPlan.takeProfitPrice,
            quantity,
            capitalAllocated,
            leverageUsed: leverage,
            entryFeeUsd,
            openedAt: new Date(nextCandle.openTime).toISOString(),
          };
        }
      }
    }

    const markedEquity =
      openPosition === null
        ? equity
        : equity +
          markOpenPositionToMarket({
            position: openPosition,
            markPrice: currentCandle.close,
          });
    const holdEquity = holdUnits * currentCandle.close;
    peakEquity = Math.max(peakEquity, markedEquity);
    const drawdownPercent =
      peakEquity <= 0 ? 0 : ((peakEquity - markedEquity) / peakEquity) * 100;
    const isoTime = new Date(currentCandle.closeTime).toISOString();

    equityCurve.push({
      time: isoTime,
      equity: roundTo(markedEquity),
    });
    holdCurve.push({
      time: isoTime,
      equity: roundTo(holdEquity),
    });
    drawdownCurve.push({
      time: isoTime,
      drawdownPercent: roundTo(drawdownPercent, 4),
    });
  }

  if (openPosition) {
    const lastCandle = input.candles[input.candles.length - 1];

    if (lastCandle) {
      const exitPrice = applyAdverseSlippage(
        lastCandle.close,
        openPosition.side,
        slippageRate,
        "exit",
      );
      const exitNotional = openPosition.quantity * exitPrice;
      const exitFeeUsd = exitNotional * feeRate;
      const realizedPnl =
        calculateDirectionalPnl(
          openPosition.side,
          openPosition.entryPrice,
          exitPrice,
        ) *
          openPosition.quantity -
        openPosition.entryFeeUsd -
        exitFeeUsd;

      const trade: SimulatedPresetTrade = {
        id: openPosition.id,
        side: openPosition.side,
        openedAt: openPosition.openedAt,
        closedAt: new Date(lastCandle.closeTime).toISOString(),
        entryPrice: roundTo(openPosition.entryPrice),
        exitPrice: roundTo(exitPrice),
        stopLossPrice: roundTo(openPosition.stopLossPrice),
        takeProfitPrice: roundTo(openPosition.takeProfitPrice),
        quantity: roundTo(openPosition.quantity, 8),
        capitalAllocated: roundTo(openPosition.capitalAllocated),
        leverageUsed: roundTo(openPosition.leverageUsed, 4),
        entryFeeUsd: roundTo(openPosition.entryFeeUsd),
        exitFeeUsd: roundTo(exitFeeUsd),
        realizedPnl: roundTo(realizedPnl),
        realizedPnlPercentOnCapital: roundTo(
          openPosition.capitalAllocated <= 0
            ? 0
            : (realizedPnl / openPosition.capitalAllocated) * 100,
          4,
        ),
        closeReason: "signal_end_of_period",
      };

      trades.push(trade);
      equity += trade.realizedPnl;
      openPosition = null;
    }
  }

  return {
    summary: createSimulationSummary({
      initialCapitalUsd: input.initialCapitalUsd,
      endingEquityUsd: equity,
      endingHoldEquityUsd: holdCurve.at(-1)?.equity ?? input.initialCapitalUsd,
      trades,
      maxDrawdownPercent:
        drawdownCurve.reduce(
          (max, point) => Math.max(max, point.drawdownPercent),
          0,
        ) ?? 0,
    }),
    equityCurve,
    holdCurve,
    drawdownCurve,
    trades,
  };
}

export function getRequiredPeriod(technicalContract: PresetTechnicalContract): number {
  const indicatorPeriods = Object.values(technicalContract.indicators).map(
    (indicator) => {
      switch (indicator.type) {
        case "ema":
        case "rsi":
        case "atr":
        case "sma":
          return indicator.period;
        case "donchian":
        case "volumeProfile":
          // janela exclui o candle atual → precisa de period + 1 candles
          return indicator.period + 1;
        case "adx":
          // dupla suavização de Wilder (DI e depois ADX)
          return indicator.period * 2;
        case "volume":
          return 1;
      }
    },
  );

  const stopLoss = technicalContract.risk.stopLoss;
  const stopLossPeriod =
    stopLoss.mode === "atr"
      ? stopLoss.period
      : stopLoss.mode === "volumeProfile"
        ? // janela exclui o candle atual, igual ao indicador
          stopLoss.period + 1
        : 1;

  return Math.max(...indicatorPeriods, stopLossPeriod);
}

export function getIntervalDurationMs(interval: MarketCandleInterval): number {
  switch (interval) {
    case "1m":
      return 60_000;
    case "3m":
      return 180_000;
    case "5m":
      return 300_000;
    case "15m":
      return 900_000;
    case "30m":
      return 1_800_000;
    case "1h":
      return 3_600_000;
    case "2h":
      return 7_200_000;
    case "4h":
      return 14_400_000;
    case "6h":
      return 21_600_000;
    case "12h":
      return 43_200_000;
    case "1d":
      return 86_400_000;
  }
}

export function toPacificaMarketSymbol(symbol: string): string | null {
  const match = symbol.match(/^([A-Z]+)\/USDC$/);
  return match?.[1] ?? null;
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/**
 * First candle that may open a trade: the lookback the indicators need, pushed
 * forward to `tradingStartTime` when the caller measures a specific period.
 */
function resolveTradingStartIndex(
  candles: MarketCandle[],
  requiredPeriod: number,
  tradingStartTime: number | undefined,
): number {
  if (tradingStartTime === undefined) {
    return requiredPeriod;
  }

  const firstInPeriod = candles.findIndex(
    (candle) => candle.openTime >= tradingStartTime,
  );

  return firstInPeriod === -1
    ? candles.length
    : Math.max(requiredPeriod, firstInPeriod);
}

// Séries que o engine resolve sozinho — o resto de um `source` tem que ser
// outro indicador declarado no mesmo draft
const BUILT_IN_INDICATOR_SOURCES = new Set(["close", "volume", "PRICE"]);

/**
 * `source` pode encadear indicadores (ex.: uma sma sobre uma ema). Duas formas
 * de quebrar isso passam pelo schema: apontar para um indicador inexistente
 * (série toda-NaN → a regra nunca é satisfeita) e fechar um ciclo (`A → B → A`
 * → a resolução recursiva estoura a pilha). Nos dois casos a estratégia nunca
 * operaria, então ela não pode ser ativada.
 */
function hasInvalidIndicatorSource(
  indicators: Record<string, IndicatorConfig>,
): boolean {
  const sourceOf = (name: string): string | undefined => {
    const config = indicators[name];
    return config && (config.type === "sma" || config.type === "ema")
      ? config.source
      : undefined;
  };

  for (const name of Object.keys(indicators)) {
    const visited = new Set<string>([name]);
    let current = sourceOf(name);

    while (current !== undefined && !BUILT_IN_INDICATOR_SOURCES.has(current)) {
      if (!(current in indicators) || visited.has(current)) {
        return true;
      }
      visited.add(current);
      current = sourceOf(current);
    }
  }

  return false;
}

function ensureRiskSupportIndicators(
  draft: YourStrategyDraft,
): Record<string, IndicatorConfig> {
  const indicators = { ...draft.indicators };

  if (draft.risk.stopLoss.mode === "atr") {
    const atrPeriod = draft.risk.stopLoss.period;
    const atrAlreadyExists = Object.values(indicators).some(
      (indicator) => indicator.type === "atr" && indicator.period === atrPeriod,
    );

    if (!atrAlreadyExists) {
      indicators[`ATR_AUTO_${atrPeriod}`] = {
        type: "atr",
        period: atrPeriod,
      };
    }
  }

  // Stop na value area precisa das DUAS bordas: long para abaixo da VAL, short
  // para acima da VAH. O usuário não precisa declarar nenhuma delas no builder.
  if (draft.risk.stopLoss.mode === "volumeProfile") {
    const period = draft.risk.stopLoss.period;

    for (const level of ["val", "vah"] as const) {
      const alreadyExists = Object.values(indicators).some(
        (indicator) =>
          indicator.type === "volumeProfile" &&
          indicator.level === level &&
          indicator.period === period,
      );

      if (!alreadyExists) {
        indicators[`VP_AUTO_${period}_${level.toUpperCase()}`] = {
          type: "volumeProfile",
          period,
          level,
        };
      }
    }
  }

  return indicators;
}

function buildIndicatorSeriesMap(
  indicators: PresetTechnicalContract["indicators"],
  candles: MarketCandle[],
): Record<string, IndicatorSeries> {
  const closeSeries = candles.map((candle) => candle.close);
  const highSeries = candles.map((candle) => candle.high);
  const lowSeries = candles.map((candle) => candle.low);
  const volumeSeries = candles.map((candle) => candle.volume);
  const cache: Record<string, IndicatorSeries> = {
    PRICE: closeSeries.slice(),
  };

  function getIndicatorSeries(indicatorName: string): IndicatorSeries {
    if (cache[indicatorName]) {
      return cache[indicatorName];
    }

    const config = indicators[indicatorName];

    if (!config) {
      cache[indicatorName] = createIndicatorNaNSeries(candles.length);
      return cache[indicatorName];
    }

    switch (config.type) {
      case "ema": {
        const sourceSeries =
          config.source === "volume"
            ? volumeSeries
            : config.source === "close" || config.source === undefined
              ? closeSeries
              : getIndicatorSeries(config.source);
        cache[indicatorName] = calculateEmaSeries(sourceSeries, config.period);
        break;
      }
      case "rsi":
        cache[indicatorName] = calculateRsiSeries(closeSeries, config.period);
        break;
      case "atr":
        cache[indicatorName] = calculateAtrSeries(
          highSeries,
          lowSeries,
          closeSeries,
          config.period,
        );
        break;
      case "volume":
        cache[indicatorName] = volumeSeries.slice();
        break;
      case "sma": {
        const sourceSeries =
          config.source === "volume"
            ? volumeSeries
            : config.source === "close"
              ? closeSeries
              : getIndicatorSeries(config.source);
        cache[indicatorName] = calculateSmaSeries(sourceSeries, config.period);
        break;
      }
      case "donchian":
        cache[indicatorName] = calculateDonchianSeries(
          highSeries,
          lowSeries,
          config.period,
          config.band,
        );
        break;
      case "adx":
        cache[indicatorName] = calculateAdxSeries(
          highSeries,
          lowSeries,
          closeSeries,
          config.period,
        );
        break;
      case "volumeProfile":
        cache[indicatorName] = calculateVolumeProfileSeries(
          highSeries,
          lowSeries,
          closeSeries,
          volumeSeries,
          config.period,
          config.level,
          INDICATOR_TAIL_POSITIONS,
        );
        break;
    }

    return cache[indicatorName];
  }

  Object.keys(indicators).forEach((indicatorName) => {
    getIndicatorSeries(indicatorName);
  });

  return cache;
}

function maybeClosePosition(input: {
  candle: MarketCandle;
  position: {
    id: string;
    side: TradeSide;
    entryPrice: number;
    stopLossPrice: number;
    takeProfitPrice: number;
    quantity: number;
    capitalAllocated: number;
    leverageUsed: number;
    entryFeeUsd: number;
    openedAt: string;
  };
  feeRate: number;
  slippageRate: number;
}): { trade: SimulatedPresetTrade } | null {
  const stopHit =
    input.position.side === "long"
      ? input.candle.low <= input.position.stopLossPrice
      : input.candle.high >= input.position.stopLossPrice;
  const takeProfitHit =
    input.position.side === "long"
      ? input.candle.high >= input.position.takeProfitPrice
      : input.candle.low <= input.position.takeProfitPrice;

  if (!stopHit && !takeProfitHit) {
    return null;
  }

  const closeReason = stopHit ? "stop_loss" : "take_profit";
  const rawExitPrice =
    closeReason === "stop_loss"
      ? input.position.stopLossPrice
      : input.position.takeProfitPrice;
  const exitPrice = applyAdverseSlippage(
    rawExitPrice,
    input.position.side,
    input.slippageRate,
    "exit",
  );
  const exitNotional = input.position.quantity * exitPrice;
  const exitFeeUsd = exitNotional * input.feeRate;
  const realizedPnl =
    calculateDirectionalPnl(
      input.position.side,
      input.position.entryPrice,
      exitPrice,
    ) *
      input.position.quantity -
    input.position.entryFeeUsd -
    exitFeeUsd;

  return {
    trade: {
      id: input.position.id,
      side: input.position.side,
      openedAt: input.position.openedAt,
      closedAt: new Date(input.candle.closeTime).toISOString(),
      entryPrice: roundTo(input.position.entryPrice),
      exitPrice: roundTo(exitPrice),
      stopLossPrice: roundTo(input.position.stopLossPrice),
      takeProfitPrice: roundTo(input.position.takeProfitPrice),
      quantity: roundTo(input.position.quantity, 8),
      capitalAllocated: roundTo(input.position.capitalAllocated),
      leverageUsed: roundTo(input.position.leverageUsed, 4),
      entryFeeUsd: roundTo(input.position.entryFeeUsd),
      exitFeeUsd: roundTo(exitFeeUsd),
      realizedPnl: roundTo(realizedPnl),
      realizedPnlPercentOnCapital: roundTo(
        input.position.capitalAllocated <= 0
          ? 0
          : (realizedPnl / input.position.capitalAllocated) * 100,
        4,
      ),
      closeReason,
    },
  };
}

function createSimulationSummary(input: {
  initialCapitalUsd: number;
  endingEquityUsd: number;
  endingHoldEquityUsd: number;
  trades: SimulatedPresetTrade[];
  maxDrawdownPercent: number;
}): SimulatedPresetSummary {
  const wins = input.trades.filter((trade) => trade.realizedPnl >= 0).length;
  const losses = input.trades.length - wins;
  const grossProfit = input.trades
    .filter((trade) => trade.realizedPnl > 0)
    .reduce((sum, trade) => sum + trade.realizedPnl, 0);
  const grossLoss = Math.abs(
    input.trades
      .filter((trade) => trade.realizedPnl < 0)
      .reduce((sum, trade) => sum + trade.realizedPnl, 0),
  );
  const strategyReturnPercent =
    ((input.endingEquityUsd - input.initialCapitalUsd) / input.initialCapitalUsd) *
    100;
  const holdReturnPercent =
    ((input.endingHoldEquityUsd - input.initialCapitalUsd) /
      input.initialCapitalUsd) *
    100;

  return {
    initialCapitalUsd: roundTo(input.initialCapitalUsd),
    endingEquityUsd: roundTo(input.endingEquityUsd),
    endingHoldEquityUsd: roundTo(input.endingHoldEquityUsd),
    strategyReturnPercent: roundTo(strategyReturnPercent, 4),
    holdReturnPercent: roundTo(holdReturnPercent, 4),
    alphaVsHoldPercent: roundTo(strategyReturnPercent - holdReturnPercent, 4),
    maxDrawdownPercent: roundTo(input.maxDrawdownPercent, 4),
    winRatePercent: roundTo(
      input.trades.length === 0 ? 0 : (wins / input.trades.length) * 100,
      4,
    ),
    profitFactor: roundTo(
      grossLoss === 0 ? grossProfit : grossProfit / grossLoss,
      4,
    ),
    totalTrades: input.trades.length,
    wins,
    losses,
  };
}

function resolveCapitalAllocation(
  technicalContract: PresetTechnicalContract,
  equity: number,
): number {
  switch (technicalContract.execution.positionSize.type) {
    case "fixedPercent":
      return equity * (technicalContract.execution.positionSize.value / 100);
  }
}

function calculateDirectionalPnl(
  side: TradeSide,
  entryPrice: number,
  exitPrice: number,
): number {
  return side === "long" ? exitPrice - entryPrice : entryPrice - exitPrice;
}

function markOpenPositionToMarket(input: {
  position: {
    side: TradeSide;
    entryPrice: number;
    quantity: number;
    entryFeeUsd: number;
  };
  markPrice: number;
}): number {
  return (
    calculateDirectionalPnl(
      input.position.side,
      input.position.entryPrice,
      input.markPrice,
    ) *
      input.position.quantity -
    input.position.entryFeeUsd
  );
}

function applyAdverseSlippage(
  price: number,
  side: TradeSide,
  slippageRate: number,
  phase: "entry" | "exit",
): number {
  if (slippageRate <= 0) {
    return price;
  }

  if (phase === "entry") {
    return side === "long"
      ? price * (1 + slippageRate)
      : price * (1 - slippageRate);
  }

  return side === "long"
    ? price * (1 - slippageRate)
    : price * (1 + slippageRate);
}

function roundTo(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function evaluateRuleGroup(
  direction: "long" | "short",
  groupType: "all" | "any",
  rules: PresetTriggerRule[],
  indicatorSeries: Record<string, IndicatorSeries>,
): PresetRuleEvaluation[] {
  return rules.map((rule, ruleIndex) =>
    evaluateRule(direction, groupType, rule, ruleIndex, indicatorSeries),
  );
}

function evaluateRule(
  direction: "long" | "short",
  groupType: "all" | "any",
  rule: PresetTriggerRule,
  ruleIndex: number,
  indicatorSeries: Record<string, IndicatorSeries>,
): PresetRuleEvaluation {
  if (rule.type === "threshold") {
    const series = indicatorSeries[rule.indicator] ?? [];
    const currentValue = getScopedValue(series, rule.scope);
    const targetValue =
      rule.ref !== undefined
        ? getScopedValue(indicatorSeries[rule.ref] ?? [], rule.scope)
        : rule.value;
    const satisfied =
      currentValue !== null &&
      targetValue !== null &&
      compareThreshold(currentValue, rule.operator, targetValue);

    return {
      direction,
      ruleIndex,
      scope: rule.scope,
      type: rule.type,
      indicator: rule.indicator,
      operator: rule.operator,
      ref: rule.ref ?? null,
      value: rule.value ?? null,
      satisfied,
      explanation: `${groupType.toUpperCase()} rule ${ruleIndex + 1}: ${rule.indicator} ${rule.operator} ${rule.ref ?? rule.value}`,
    };
  }

  const indicatorValues = getScopedCrossValues(
    indicatorSeries[rule.indicator] ?? [],
    rule.scope,
  );
  const referenceValues =
    rule.ref !== undefined
      ? getScopedCrossValues(indicatorSeries[rule.ref] ?? [], rule.scope)
      : (() => {
          const numericValue = rule.value;
          if (numericValue === undefined) {
            return null;
          }

          return {
            previous: numericValue,
            current: numericValue,
          };
        })();
  const satisfied =
    indicatorValues !== null &&
    referenceValues !== null &&
    compareCross(
      indicatorValues.previous,
      indicatorValues.current,
      referenceValues.previous,
      referenceValues.current,
      rule.operator,
    );

  return {
    direction,
    ruleIndex,
    scope: rule.scope,
    type: rule.type,
    indicator: rule.indicator,
    operator: rule.operator,
    ref: rule.ref ?? null,
    value: rule.value ?? null,
    satisfied,
    explanation: `${groupType.toUpperCase()} rule ${ruleIndex + 1}: ${rule.indicator} ${rule.operator} ${rule.ref ?? rule.value}`,
  };
}

function didRuleGroupPass(
  groupType: "all" | "any",
  evaluations: PresetRuleEvaluation[],
): boolean {
  if (evaluations.length === 0) {
    return false;
  }

  return groupType === "all"
    ? evaluations.every((evaluation) => evaluation.satisfied)
    : evaluations.some((evaluation) => evaluation.satisfied);
}

function resolveRiskDistances(
  technicalContract: PresetTechnicalContract,
  indicators: Record<string, { previous: number | null; current: number | null }>,
  entryPrice: number,
): { long: number | null; short: number | null } {
  const stopLoss = technicalContract.risk.stopLoss;

  if (stopLoss.mode === "static") {
    const distance = entryPrice * (stopLoss.value / 100);
    return { long: distance, short: distance };
  }

  if (stopLoss.mode === "atr") {
    const atrIndicator = findAtrIndicatorName(technicalContract);
    const atrValue =
      (atrIndicator ? indicators[atrIndicator]?.current : null) ?? null;

    if (
      typeof atrValue === "number" &&
      Number.isFinite(atrValue) &&
      atrValue > 0
    ) {
      const distance = atrValue * stopLoss.multiplier;
      return { long: distance, short: distance };
    }

    // Indicador de ATR ausente é BUG de configuração (o materialize injeta um),
    // não estado de mercado — tem que ser barulhento, não virar "não opera nunca"
    throw new Error("ATR-based stop loss could not be derived from indicator evaluation.");
  }

  // Value area: long para abaixo da VAL, short para acima da VAH. Cada lado tem
  // a SUA distância, e um lado pode não ter stop nenhum — se o preço está dentro
  // da value area, a borda oposta fica do lado errado da entrada. Isso é mercado
  // normal (só não dá para operar aquele lado ali), então devolve null e o
  // chamador pula o trade.
  const valName = findVolumeProfileName(technicalContract, "val", stopLoss.period);
  const vahName = findVolumeProfileName(technicalContract, "vah", stopLoss.period);
  const val = (valName ? indicators[valName]?.current : null) ?? null;
  const vah = (vahName ? indicators[vahName]?.current : null) ?? null;

  const buffer = entryPrice * (stopLoss.bufferPercent / 100);

  const longDistance =
    typeof val === "number" && Number.isFinite(val)
      ? entryPrice - val + buffer
      : null;
  const shortDistance =
    typeof vah === "number" && Number.isFinite(vah)
      ? vah - entryPrice + buffer
      : null;

  return {
    long: longDistance !== null && longDistance > 0 ? longDistance : null,
    short: shortDistance !== null && shortDistance > 0 ? shortDistance : null,
  };
}

function findVolumeProfileName(
  technicalContract: PresetTechnicalContract,
  level: "vah" | "val",
  period: number,
): string | null {
  for (const [name, config] of Object.entries(technicalContract.indicators)) {
    if (
      config.type === "volumeProfile" &&
      config.level === level &&
      config.period === period
    ) {
      return name;
    }
  }
  return null;
}

function findAtrIndicatorName(technicalContract: PresetTechnicalContract): string | null {
  for (const [indicatorName, indicatorConfig] of Object.entries(
    technicalContract.indicators,
  )) {
    if (indicatorConfig.type === "atr") {
      return indicatorName;
    }
  }

  return null;
}

function getScopedValue(
  series: number[],
  scope: "previousCandle" | "currentCandle",
): number | null {
  const offset = scope === "currentCandle" ? 1 : 2;
  return toNullableFinite(series.at(-offset));
}

function getScopedCrossValues(
  series: number[],
  scope: "previousCandle" | "currentCandle",
): { previous: number; current: number } | null {
  if (scope === "currentCandle") {
    const previous = toNullableFinite(series.at(-2));
    const current = toNullableFinite(series.at(-1));
    return previous === null || current === null ? null : { previous, current };
  }

  const previous = toNullableFinite(series.at(-3));
  const current = toNullableFinite(series.at(-2));
  return previous === null || current === null ? null : { previous, current };
}

function compareThreshold(
  currentValue: number,
  operator: "above" | "below" | "atOrAbove" | "atOrBelow" | "equal",
  targetValue: number,
): boolean {
  switch (operator) {
    case "above":
      return currentValue > targetValue;
    case "below":
      return currentValue < targetValue;
    case "atOrAbove":
      return currentValue >= targetValue;
    case "atOrBelow":
      return currentValue <= targetValue;
    case "equal":
      return currentValue === targetValue;
  }
}

function compareCross(
  previousValue: number,
  currentValue: number,
  previousReference: number,
  currentReference: number,
  operator: "crossesAbove" | "crossesBelow",
): boolean {
  if (operator === "crossesAbove") {
    return previousValue <= previousReference && currentValue > currentReference;
  }

  return previousValue >= previousReference && currentValue < currentReference;
}

function toNullableFinite(value: number | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
