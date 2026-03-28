import type {
  MarketCandle,
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

function createEmptySeries(length: number) {
  return Array.from({ length }, () => Number.NaN);
}

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

function calculateRsiValue(averageGain: number, averageLoss: number) {
  if (averageLoss === 0) {
    return 100;
  }

  const relativeStrength = averageGain / averageLoss;
  return 100 - 100 / (1 + relativeStrength);
}

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

function getScopedValue(series: number[], scope: "previousCandle" | "currentCandle") {
  const offset = scope === "currentCandle" ? 1 : 2;
  return toNullableFinite(series.at(-offset));
}

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

function toNullableFinite(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
