import type {
  MarketCandle,
  MarketCandleInterval,
  PresetEditableConfig,
  PresetRuleEvaluation,
  PresetSignal,
  PresetTechnicalContract,
  PresetTriggerRule,
  TradeSide,
  YourStrategyActivationBlocker,
  YourStrategyDraft,
} from "@pacifica/contracts";

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

/**
 * Evaluates the canonical preset technical contract against a candle series.
 *
 * Responsibility:
 * - compute all declared indicators
 * - evaluate long/short trigger groups
 * - return an auditable signal snapshot for downstream runtime decisions
 */
export function evaluatePresetSignal(
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
 * Converts the evaluated preset risk configuration into executable long/short
 * price plans around the current entry reference price.
 */
export function buildPresetRiskPlans(
  technicalContract: PresetTechnicalContract,
  indicators: Record<string, { previous: number | null; current: number | null }>,
  entryPrice: number,
) {
  const riskDistance = resolveRiskDistance(
    technicalContract,
    indicators,
    entryPrice,
  );

  return {
    long: {
      side: "long" as const,
      entryPrice,
      stopLossPrice: entryPrice - riskDistance,
      takeProfitPrice:
        entryPrice + riskDistance * technicalContract.risk.takeProfit.multiple,
      riskDistance,
    },
    short: {
      side: "short" as const,
      entryPrice,
      stopLossPrice: entryPrice + riskDistance,
      takeProfitPrice:
        entryPrice - riskDistance * technicalContract.risk.takeProfit.multiple,
      riskDistance,
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

/**
 * Converts the persisted YOUR Strategy draft into the current canonical
 * technical contract whenever the current runtime can execute it safely.
 *
 * Responsibility:
 * - normalize the custom strategy into the same contract family used by the engine
 * - expose blockers when the draft is valid for persistence but not yet executable
 *
 * Non-responsibility:
 * - it does not persist the draft
 * - it does not run preview, activation or readiness checks
 */
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

function ensureRiskSupportIndicators(draft: YourStrategyDraft) {
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

  return indicators;
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

  const firstTradableCandle = input.candles[requiredPeriod];

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

  for (let index = requiredPeriod; index < input.candles.length; index += 1) {
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
      const candleWindow = input.candles.slice(0, index + 1);
      const evaluation = evaluatePresetSignal(input.technicalContract, candleWindow);

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
        const riskPlans = buildPresetRiskPlans(
          input.technicalContract,
          evaluation.indicators,
          entryPrice,
        );
        const quantity = notionalUsd / entryPrice;
        const entryFeeUsd = notionalUsd * feeRate;

        openPosition = {
          id: `${currentCandle.closeTime}-${evaluation.signal}`,
          side: evaluation.signal,
          entryPrice,
          stopLossPrice:
            evaluation.signal === "long"
              ? riskPlans.long.stopLossPrice
              : riskPlans.short.stopLossPrice,
          takeProfitPrice:
            evaluation.signal === "long"
              ? riskPlans.long.takeProfitPrice
              : riskPlans.short.takeProfitPrice,
          quantity,
          capitalAllocated,
          leverageUsed: leverage,
          entryFeeUsd,
          openedAt: new Date(nextCandle.openTime).toISOString(),
        };
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
        calculateDirectionalPnl(openPosition.side, openPosition.entryPrice, exitPrice) *
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

/**
 * Resolves the longest lookback period required by indicators and ATR-based
 * risk calculation so callers can fetch enough candles up front.
 */
export function getRequiredPeriod(technicalContract: PresetTechnicalContract) {
  const indicatorPeriods = Object.values(technicalContract.indicators).map(
    (indicator) => {
      switch (indicator.type) {
        case "ema":
        case "rsi":
        case "atr":
        case "sma":
          return indicator.period;
        case "volume":
          return 1;
      }
    },
  );

  const stopLossPeriod =
    technicalContract.risk.stopLoss.mode === "atr"
      ? technicalContract.risk.stopLoss.period
      : 1;

  return Math.max(...indicatorPeriods, stopLossPeriod);
}

/**
 * Converts the candle interval contract into milliseconds for range
 * calculation and cadence helpers.
 */
export function getIntervalDurationMs(interval: MarketCandleInterval) {
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

/**
 * Normalizes the editable UI symbol into the Pacifica market symbol.
 */
export function toPacificaMarketSymbol(symbol: string) {
  const match = symbol.match(/^([A-Z]+)\/USDC$/);
  return match?.[1] ?? null;
}

/**
 * Materializes every indicator series declared by the preset contract.
 *
 * The function caches intermediate series so dependent indicators do not
 * recalculate their sources multiple times.
 */
function buildIndicatorSeriesMap(
  indicators: PresetTechnicalContract["indicators"],
  candles: MarketCandle[],
) {
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
      cache[indicatorName] = createEmptySeries(candles.length);
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
        cache[indicatorName] = calculateEma(sourceSeries, config.period);
        break;
      }
      case "rsi":
        cache[indicatorName] = calculateRsi(closeSeries, config.period);
        break;
      case "atr":
        cache[indicatorName] = calculateAtr(
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
        cache[indicatorName] = calculateSma(sourceSeries, config.period);
        break;
      }
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
}) {
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
    } satisfies SimulatedPresetTrade,
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
) {
  switch (technicalContract.execution.positionSize.type) {
    case "fixedPercent":
      return equity * (technicalContract.execution.positionSize.value / 100);
  }
}

function calculateDirectionalPnl(
  side: TradeSide,
  entryPrice: number,
  exitPrice: number,
) {
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
}) {
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
) {
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

function roundTo(value: number, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Evaluates all rules in one trigger group (`all` / `any`) for one direction.
 */
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

/**
 * Evaluates one threshold/cross rule and returns an auditable explanation.
 */
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

/**
 * Resolves whether the trigger group passes as a whole.
 */
function didRuleGroupPass(
  groupType: "all" | "any",
  evaluations: PresetRuleEvaluation[],
) {
  if (evaluations.length === 0) {
    return false;
  }

  return groupType === "all"
    ? evaluations.every((evaluation) => evaluation.satisfied)
    : evaluations.some((evaluation) => evaluation.satisfied);
}

/**
 * Resolves the absolute stop-loss distance from the preset contract.
 */
function resolveRiskDistance(
  technicalContract: PresetTechnicalContract,
  indicators: Record<string, { previous: number | null; current: number | null }>,
  entryPrice: number,
) {
  if (technicalContract.risk.stopLoss.mode === "static") {
    return entryPrice * (technicalContract.risk.stopLoss.value / 100);
  }

  const atrIndicator = findAtrIndicatorName(technicalContract);
  const atrValue =
    (atrIndicator ? indicators[atrIndicator]?.current : null) ?? null;

  if (typeof atrValue === "number" && Number.isFinite(atrValue) && atrValue > 0) {
    return atrValue * technicalContract.risk.stopLoss.multiplier;
  }

  throw new Error("ATR-based stop loss could not be derived from indicator evaluation.");
}

/**
 * Finds the indicator key that represents ATR inside the preset definition.
 */
function findAtrIndicatorName(technicalContract: PresetTechnicalContract) {
  for (const [indicatorName, indicatorConfig] of Object.entries(
    technicalContract.indicators,
  )) {
    if (indicatorConfig.type === "atr") {
      return indicatorName;
    }
  }

  return null;
}

/**
 * Creates an indicator series prefilled with `NaN` placeholders so indexing is
 * preserved even before enough data exists to calculate a real value.
 */
function createEmptySeries(length: number) {
  return Array.from({ length }, () => Number.NaN);
}

/**
 * Calculates a simple moving average aligned to the original series length.
 */
function calculateSma(values: number[], period: number) {
  const result = createEmptySeries(values.length);

  for (let index = period - 1; index < values.length; index += 1) {
    let sum = 0;
    let valid = true;

    for (let cursor = index - period + 1; cursor <= index; cursor += 1) {
      const value = values[cursor];

      if (typeof value !== "number" || !Number.isFinite(value)) {
        valid = false;
        break;
      }

      sum += value;
    }

    if (valid) {
      result[index] = sum / period;
    }
  }

  return result;
}

/**
 * Calculates an exponential moving average aligned to the original series
 * length, using SMA as the initial seed.
 */
function calculateEma(values: number[], period: number) {
  const result = createEmptySeries(values.length);
  const smoothingMultiplier = 2 / (period + 1);
  const seedIndex = period - 1;

  if (values.length < period) {
    return result;
  }

  let seedSum = 0;

  for (let index = 0; index < period; index += 1) {
    seedSum += values[index] ?? 0;
  }

  result[seedIndex] = seedSum / period;

  for (let index = seedIndex + 1; index < values.length; index += 1) {
    result[index] =
      (values[index] ?? 0) * smoothingMultiplier +
      (result[index - 1] ?? 0) * (1 - smoothingMultiplier);
  }

  return result;
}

/**
 * Calculates RSI using Wilder-style smoothed average gain/loss.
 */
function calculateRsi(values: number[], period: number) {
  const result = createEmptySeries(values.length);

  if (values.length <= period) {
    return result;
  }

  let gains = 0;
  let losses = 0;

  for (let index = 1; index <= period; index += 1) {
    const delta = (values[index] ?? 0) - (values[index - 1] ?? 0);
    gains += Math.max(delta, 0);
    losses += Math.max(-delta, 0);
  }

  let averageGain = gains / period;
  let averageLoss = losses / period;
  result[period] = calculateRsiValue(averageGain, averageLoss);

  for (let index = period + 1; index < values.length; index += 1) {
    const delta = (values[index] ?? 0) - (values[index - 1] ?? 0);
    const gain = Math.max(delta, 0);
    const loss = Math.max(-delta, 0);

    averageGain = (averageGain * (period - 1) + gain) / period;
    averageLoss = (averageLoss * (period - 1) + loss) / period;
    result[index] = calculateRsiValue(averageGain, averageLoss);
  }

  return result;
}

/**
 * Converts average gain/loss into an RSI value.
 */
function calculateRsiValue(averageGain: number, averageLoss: number) {
  if (averageLoss === 0) {
    return 100;
  }

  const relativeStrength = averageGain / averageLoss;
  return 100 - 100 / (1 + relativeStrength);
}

/**
 * Calculates ATR using true range plus Wilder smoothing.
 */
function calculateAtr(
  highs: number[],
  lows: number[],
  closes: number[],
  period: number,
) {
  const trueRanges = createEmptySeries(highs.length);

  for (let index = 1; index < highs.length; index += 1) {
    trueRanges[index] = Math.max(
      (highs[index] ?? 0) - (lows[index] ?? 0),
      Math.abs((highs[index] ?? 0) - (closes[index - 1] ?? 0)),
      Math.abs((lows[index] ?? 0) - (closes[index - 1] ?? 0)),
    );
  }

  const result = createEmptySeries(highs.length);

  if (highs.length <= period) {
    return result;
  }

  let seedSum = 0;

  for (let index = 1; index <= period; index += 1) {
    seedSum += trueRanges[index] ?? 0;
  }

  result[period] = seedSum / period;

  for (let index = period + 1; index < highs.length; index += 1) {
    result[index] =
      (((result[index - 1] ?? 0) * (period - 1)) + (trueRanges[index] ?? 0)) /
      period;
  }

  return result;
}

/**
 * Picks the last usable value for a threshold rule according to the configured
 * candle scope.
 */
function getScopedValue(series: number[], scope: "previousCandle" | "currentCandle") {
  const offset = scope === "currentCandle" ? 1 : 2;
  return toNullableFinite(series.at(-offset));
}

/**
 * Picks the two values required to evaluate a cross rule according to the
 * configured candle scope.
 */
function getScopedCrossValues(
  series: number[],
  scope: "previousCandle" | "currentCandle",
) {
  if (scope === "currentCandle") {
    const previous = toNullableFinite(series.at(-2));
    const current = toNullableFinite(series.at(-1));
    return previous === null || current === null ? null : { previous, current };
  }

  const previous = toNullableFinite(series.at(-3));
  const current = toNullableFinite(series.at(-2));
  return previous === null || current === null ? null : { previous, current };
}

/**
 * Evaluates one threshold comparison against a target constant.
 */
function compareThreshold(
  currentValue: number,
  operator: "above" | "below" | "atOrAbove" | "atOrBelow" | "equal",
  targetValue: number,
) {
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

/**
 * Evaluates whether one series crossed another between the previous and
 * current scoped values.
 */
function compareCross(
  previousValue: number,
  currentValue: number,
  previousReference: number,
  currentReference: number,
  operator: "crossesAbove" | "crossesBelow",
) {
  if (operator === "crossesAbove") {
    return previousValue <= previousReference && currentValue > currentReference;
  }

  return previousValue >= previousReference && currentValue < currentReference;
}

/**
 * Normalizes invalid numeric values to `null` for outward-facing snapshots and
 * rule evaluation helpers.
 */
function toNullableFinite(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
