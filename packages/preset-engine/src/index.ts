import type {
  MarketCandle,
  MarketCandleInterval,
  PresetRuleEvaluation,
  PresetSignal,
  PresetTechnicalContract,
  PresetTriggerRule,
} from "@pacifica/contracts";

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
  const cache: Record<string, IndicatorSeries> = {};

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
      case "ema":
        cache[indicatorName] = calculateEma(closeSeries, config.period);
        break;
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
    const satisfied =
      currentValue !== null &&
      compareThreshold(currentValue, rule.operator, rule.value);

    return {
      direction,
      ruleIndex,
      scope: rule.scope,
      type: rule.type,
      indicator: rule.indicator,
      operator: rule.operator,
      ref: null,
      value: rule.value,
      satisfied,
      explanation: `${groupType.toUpperCase()} rule ${ruleIndex + 1}: ${rule.indicator} ${rule.operator} ${rule.value}`,
    };
  }

  const indicatorValues = getScopedCrossValues(
    indicatorSeries[rule.indicator] ?? [],
    rule.scope,
  );
  const referenceValues = getScopedCrossValues(
    indicatorSeries[rule.ref] ?? [],
    rule.scope,
  );
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
    ref: rule.ref,
    value: null,
    satisfied,
    explanation: `${groupType.toUpperCase()} rule ${ruleIndex + 1}: ${rule.indicator} ${rule.operator} ${rule.ref}`,
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
