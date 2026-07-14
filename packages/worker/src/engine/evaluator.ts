import type {
  Candle,
  CandleInterval,
  IndicatorConfig,
  Signal,
  StrategyConfig,
  TriggerRule,
} from "@pacifica/shared";
import {
  calculateAdxSeries,
  calculateAtrSeries,
  calculateDonchianSeries,
  calculateEmaSeries,
  calculateRsiSeries,
  calculateSmaSeries,
  calculateVolumeProfileSeries,
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

// O engine lê exatamente estes dois pontos de cada série (scopes currentCandle e
// previousCandle) — nada olha mais fundo. Indicadores caros por posição (volume
// profile) só calculam essa cauda. Um scope novo que leia mais atrás precisa
// subir este número JUNTO, senão a série vem NaN e a regra morre em silêncio.
const INDICATOR_TAIL_POSITIONS = 2;

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
 * Converts the strategy risk configuration into executable long/short price
 * plans around the current entry reference price.
 *
 * A side comes back `null` when the config admits no valid stop there — with a
 * value-area stop that happens whenever price sits inside the value area, which
 * is a normal market state, not an error. The caller must skip the trade:
 * an order without a stop must never be submitted (CLAUDE.md, invariante 3).
 */
export function buildRiskPlans(
  technicalContract: StrategyConfig,
  indicators: Record<string, { previous: number | null; current: number | null }>,
  entryPrice: number,
): { long: RiskPlan | null; short: RiskPlan | null } {
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

function resolveRiskDistances(
  technicalContract: StrategyConfig,
  indicators: Record<string, { previous: number | null; current: number | null }>,
  entryPrice: number,
): { long: number | null; short: number | null } {
  const stopLoss = technicalContract.risk.stopLoss;

  if (stopLoss.mode === "static") {
    const distance = entryPrice * (stopLoss.value / 100);
    return { long: distance, short: distance };
  }

  if (stopLoss.mode === "atr") {
    const atrIndicator = findIndicatorName(technicalContract, "atr");
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
    throw new Error(
      "ATR-based stop loss could not be derived from indicator evaluation.",
    );
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

function findIndicatorName(
  technicalContract: StrategyConfig,
  type: "atr",
): string | null {
  for (const [name, config] of Object.entries(technicalContract.indicators)) {
    if (config.type === type) return name;
  }
  return null;
}

function findVolumeProfileName(
  technicalContract: StrategyConfig,
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

// ---------------------------------------------------------------------------
// Materialização do draft (paridade com packages/api/src/engine/evaluator.ts)
// O banco guarda o DRAFT cru do builder; o contrato executável (StrategyConfig)
// só existe depois da materialização — que preenche execution e garante os
// indicadores de suporte de risco (ex.: ATR do stop loss)
// ---------------------------------------------------------------------------

export type YourStrategyActivationBlocker =
  | "unsupported_position_size_type"
  | "take_profit_missing"
  | "stop_loss_missing"
  | "no_entry_rules"
  | "symbol_not_supported"
  | "invalid_indicator_source";

export type YourStrategyDraft = {
  name: string;
  timeframe: string;
  symbol: string;
  indicators: Record<string, IndicatorConfig>;
  entry: StrategyConfig["entry"];
  risk: {
    stopLoss: StrategyConfig["risk"]["stopLoss"];
    takeProfit: StrategyConfig["risk"]["takeProfit"] | null;
  };
  positionSizeType: "fixed_amount" | "balance_percent";
  positionSizeValue: number;
};

export type MaterializedYourStrategy = {
  technicalContract: StrategyConfig | null;
  activationBlockers: YourStrategyActivationBlocker[];
};

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

  return indicators;
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
