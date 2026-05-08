import type {
  Candle,
  CandleInterval,
  IndicatorConfig,
  Signal,
  StrategyConfig,
  TriggerRule,
} from "@pacifica/shared";
import {
  calculateAtrSeries,
  calculateEmaSeries,
  calculateRsiSeries,
  calculateSmaSeries,
  createIndicatorNaNSeries,
} from "./indicators.js";

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

type IndicatorSeries = number[];

type IndicatorSnapshot = {
  previous: number | null;
  current: number | null;
};

export type RuleEvaluation = {
  direction: "long" | "short";
  ruleIndex: number;
  scope: "previousCandle" | "currentCandle";
  type: "threshold" | "cross";
  indicator: string;
  operator: string;
  ref: string | null;
  value: number | null;
  satisfied: boolean;
  explanation: string;
};

export type EvaluatedSignal = {
  signal: Signal;
  longSignal: boolean;
  shortSignal: boolean;
  indicators: Record<string, IndicatorSnapshot>;
  longRuleEvaluations: RuleEvaluation[];
  shortRuleEvaluations: RuleEvaluation[];
};

export type RiskPlan = {
  side: "long" | "short";
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  riskDistance: number;
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Evaluates the strategy technical contract against a candle series.
 */
export function evaluateSignal(
  technicalContract: StrategyConfig,
  candles: Candle[],
): EvaluatedSignal {
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
 * Converts the strategy risk configuration into executable long/short
 * price plans around the current entry reference price.
 */
export function buildRiskPlans(
  technicalContract: StrategyConfig,
  indicators: Record<string, { previous: number | null; current: number | null }>,
  entryPrice: number,
): { long: RiskPlan; short: RiskPlan } {
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

/**
 * Resolves the longest lookback period required by indicators and ATR-based
 * risk calculation so callers can fetch enough candles up front.
 */
export function getRequiredPeriod(technicalContract: StrategyConfig): number {
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
 * Converts the candle interval into milliseconds for range calculation.
 */
export function getIntervalDurationMs(interval: CandleInterval): number {
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
export function toPacificaMarketSymbol(symbol: string): string | null {
  const match = symbol.match(/^([A-Z]+)\/USDC$/);
  return match?.[1] ?? null;
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/**
 * Materializes every indicator series declared by the strategy contract.
 */
function buildIndicatorSeriesMap(
  indicators: Record<string, IndicatorConfig>,
  candles: Candle[],
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
    }

    return cache[indicatorName];
  }

  Object.keys(indicators).forEach((indicatorName) => {
    getIndicatorSeries(indicatorName);
  });

  return cache;
}

function evaluateRuleGroup(
  direction: "long" | "short",
  groupType: "all" | "any",
  rules: TriggerRule[],
  indicatorSeries: Record<string, IndicatorSeries>,
): RuleEvaluation[] {
  return rules.map((rule, ruleIndex) =>
    evaluateRule(direction, groupType, rule, ruleIndex, indicatorSeries),
  );
}

function evaluateRule(
  direction: "long" | "short",
  groupType: "all" | "any",
  rule: TriggerRule,
  ruleIndex: number,
  indicatorSeries: Record<string, IndicatorSeries>,
): RuleEvaluation {
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
  evaluations: RuleEvaluation[],
): boolean {
  if (evaluations.length === 0) {
    return false;
  }

  return groupType === "all"
    ? evaluations.every((evaluation) => evaluation.satisfied)
    : evaluations.some((evaluation) => evaluation.satisfied);
}

function resolveRiskDistance(
  technicalContract: StrategyConfig,
  indicators: Record<string, { previous: number | null; current: number | null }>,
  entryPrice: number,
): number {
  if (technicalContract.risk.stopLoss.mode === "static") {
    return entryPrice * (technicalContract.risk.stopLoss.value / 100);
  }

  const atrIndicator = findAtrIndicatorName(technicalContract);
  const atrValue =
    (atrIndicator ? indicators[atrIndicator]?.current : null) ?? null;

  if (typeof atrValue === "number" && Number.isFinite(atrValue) && atrValue > 0) {
    return atrValue * technicalContract.risk.stopLoss.multiplier;
  }

  throw new Error(
    "ATR-based stop loss could not be derived from indicator evaluation.",
  );
}

function findAtrIndicatorName(technicalContract: StrategyConfig): string | null {
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
