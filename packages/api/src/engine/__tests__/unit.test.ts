import { describe, it, expect } from "vitest";
import {
  calculateSmaSeries,
  calculateEmaSeries,
  calculateRsiSeries,
  calculateAtrSeries,
  calculateDonchianSeries,
  calculateAdxSeries,
} from "../indicators.js";
import {
  materializeYourStrategyTechnicalContract,
  simulatePresetBacktest,
  type MarketCandle,
  type PresetTechnicalContract,
  type YourStrategyDraft,
} from "../evaluator.js";
import { indicatorGoldens } from "./indicator-goldens.js";

// ---------------------------------------------------------------------------
// Indicadores puros — golden tests de paridade com technicalindicators@3.1.0
// (cópia espelhada do worker; os dois pacotes duplicam o engine por design)
// ---------------------------------------------------------------------------

function expectSeriesMatch(actual: number[], expectedTail: readonly number[]) {
  const fullLength = actual.length;
  const offset = fullLength - expectedTail.length;

  for (let i = 0; i < offset; i += 1) {
    expect(actual[i]).toBeNaN();
  }
  for (let i = 0; i < expectedTail.length; i += 1) {
    expect(actual[offset + i]).toBeCloseTo(expectedTail[i]!, 9);
  }
}

describe("indicators (golden parity)", () => {
  const g = indicatorGoldens;

  it("SMA matches the replaced library output", () => {
    expectSeriesMatch(calculateSmaSeries([...g.closes], g.period), g.sma);
  });

  it("EMA matches the replaced library output", () => {
    expectSeriesMatch(calculateEmaSeries([...g.closes], g.period), g.ema);
  });

  it("RSI matches the replaced library output", () => {
    expectSeriesMatch(calculateRsiSeries([...g.closes], g.period), g.rsi);
  });

  it("ATR matches the replaced library output", () => {
    expectSeriesMatch(
      calculateAtrSeries([...g.highs], [...g.lows], [...g.closes], g.period),
      g.atr,
    );
  });
});

describe("indicators (semantics)", () => {
  it("RSI rounds to 2 decimals and returns 100 when there are no losses", () => {
    const rising = [1, 2, 3, 4, 5, 6, 7, 8];
    const flat = [5, 5, 5, 5, 5, 5];

    expect(calculateRsiSeries(rising, 3).at(-1)).toBe(100);
    expect(calculateRsiSeries(flat, 3).at(-1)).toBe(100);
  });

  it("SMA/EMA over an indicator source skip its NaN warm-up prefix", () => {
    // Uma série de indicador chega com NaN à frente; a soma rolante da SMA e a
    // seed da EMA carregariam esse NaN para sempre, matando a regra em silêncio
    const source = [Number.NaN, Number.NaN, 10, 11, 12, 13];

    const sma = calculateSmaSeries(source, 3);
    const ema = calculateEmaSeries(source, 3);

    expect(sma[3]).toBeNaN(); // ainda só 2 valores válidos
    expect(sma[4]).toBeCloseTo(11, 9); // média de 10, 11, 12
    expect(sma[5]).toBeCloseTo(12, 9); // média de 11, 12, 13
    expect(ema[4]).toBeCloseTo(11, 9);
    expect(ema[5]).toBeCloseTo(12, 9);
  });

  it("returns all-NaN series for empty input, period < 1 or insufficient data", () => {
    expect(calculateSmaSeries([], 3)).toEqual([]);
    expect(calculateEmaSeries([1, 2], 0).every(Number.isNaN)).toBe(true);
    expect(calculateSmaSeries([1, 2], 5).every(Number.isNaN)).toBe(true);
    expect(calculateSmaSeries([Number.NaN, Number.NaN], 2).every(Number.isNaN)).toBe(true);
    expect(calculateAtrSeries([1, 2, 3], [1, 2], [1, 2, 3], 1).every(Number.isNaN)).toBe(true);
  });

  it("donchian bands use the previous period candles (current excluded)", () => {
    const upper = calculateDonchianSeries([10, 12, 11, 15], [8, 9, 10, 13], 2, "upper");
    expect(upper[2]).toBe(12);
    expect(upper[3]).toBe(12);
  });

  it("adx saturates at 100 in a one-directional trend", () => {
    const closes = Array.from({ length: 20 }, (_, i) => 100 + i * 2);
    const highs = closes.map((c) => c + 1);
    const lows = closes.map((c) => c - 1);
    expect(calculateAdxSeries(highs, lows, closes, 3).at(-1)).toBeCloseTo(100, 6);
  });
});

// ---------------------------------------------------------------------------
// Simulação — o warm-up é histórico, não período medido
// ---------------------------------------------------------------------------

function buildSimCandles(closes: number[]): MarketCandle[] {
  return closes.map((close, index) => ({
    symbol: "BTC",
    interval: "1m" as const,
    openTime: index * 60_000,
    closeTime: (index + 1) * 60_000,
    open: close,
    high: close + 1,
    low: close - 1,
    close,
    volume: 100,
  }));
}

// Sem indicadores (requiredPeriod = 1) e com SL/TP longe demais para serem
// tocados: o único trade abre no primeiro candle negociável e fecha no fim
function buildSimContract(): PresetTechnicalContract {
  return {
    name: "sim-test",
    version: 1,
    timeframe: "1m",
    symbol: "BTC/USDC",
    indicators: {},
    entry: {
      long: {
        enabled: true,
        trigger: {
          type: "all",
          rules: [
            {
              scope: "currentCandle",
              type: "threshold",
              indicator: "PRICE",
              operator: "above",
              value: 0,
            },
          ],
        },
      },
      short: { enabled: false, trigger: { type: "all", rules: [] } },
    },
    risk: {
      stopLoss: { mode: "static", value: 50, unit: "percent" },
      takeProfit: { mode: "rr", multiple: 10 },
    },
    execution: {
      positionSize: { type: "fixedPercent", value: 100 },
      onePositionPerSymbol: true,
      manualCloseAllowed: true,
      closeOppositePositionOnSignal: false,
    },
  };
}

describe("materializeYourStrategyTechnicalContract", () => {
  function buildDraft(indicators: Record<string, unknown>): YourStrategyDraft {
    return {
      name: "d",
      timeframe: "4h",
      symbol: "BTC/USDC",
      indicators: indicators as YourStrategyDraft["indicators"],
      entry: {
        long: {
          enabled: true,
          trigger: {
            type: "all",
            rules: [
              { scope: "currentCandle", type: "threshold", indicator: "PRICE", operator: "above", value: 0 },
            ],
          },
        },
        short: { enabled: false, trigger: { type: "all", rules: [] } },
      },
      risk: {
        stopLoss: { mode: "static", value: 2, unit: "percent" },
        takeProfit: { mode: "rr", multiple: 2 },
      },
      positionSizeType: "balance_percent",
      positionSizeValue: 100,
    };
  }

  it("accepts a source chained onto another indicator", () => {
    const result = materializeYourStrategyTechnicalContract(
      buildDraft({
        EMA20: { type: "ema", period: 20 },
        SMA_OF_EMA20: { type: "sma", source: "EMA20", period: 5 },
        VOL_SMA: { type: "sma", source: "volume", period: 20 },
      }),
    );

    expect(result.activationBlockers).toEqual([]);
    expect(result.technicalContract).not.toBeNull();
  });

  // Sem isto, a resolução recursiva do source estoura a pilha em runtime
  it("blocks activation on a cyclic source", () => {
    const selfReferencing = materializeYourStrategyTechnicalContract(
      buildDraft({ A: { type: "sma", source: "A", period: 5 } }),
    );
    const mutual = materializeYourStrategyTechnicalContract(
      buildDraft({
        A: { type: "sma", source: "B", period: 5 },
        B: { type: "sma", source: "A", period: 5 },
      }),
    );

    expect(selfReferencing.activationBlockers).toContain("invalid_indicator_source");
    expect(selfReferencing.technicalContract).toBeNull();
    expect(mutual.activationBlockers).toContain("invalid_indicator_source");
    expect(mutual.technicalContract).toBeNull();
  });

  it("blocks activation on a source pointing at an indicator that does not exist", () => {
    const result = materializeYourStrategyTechnicalContract(
      buildDraft({ SMA: { type: "sma", source: "EMA_TYPO", period: 5 } }),
    );

    expect(result.activationBlockers).toContain("invalid_indicator_source");
    expect(result.technicalContract).toBeNull();
  });
});

describe("simulatePresetBacktest", () => {
  const candles = buildSimCandles([100, 101, 102, 103, 104, 105, 106, 107, 108, 109]);

  it("trades from the first candle with enough lookback when no period is given", () => {
    const result = simulatePresetBacktest({
      technicalContract: buildSimContract(),
      candles,
      initialCapitalUsd: 1000,
    });

    // sinal no candle 1 (requiredPeriod), entrada na abertura do candle 2
    expect(result.trades[0]?.openedAt).toBe(new Date(2 * 60_000).toISOString());
    expect(result.equityCurve).toHaveLength(9);
    // hold ancorado na abertura do candle 1: 1000 × 109/101
    expect(result.summary.endingHoldEquityUsd).toBeCloseTo(1079.21, 1);
  });

  it("treats candles before tradingStartTime as history only", () => {
    const result = simulatePresetBacktest({
      technicalContract: buildSimContract(),
      candles,
      initialCapitalUsd: 1000,
      tradingStartTime: candles[5]!.openTime,
    });

    // nenhum trade no warm-up: a primeira entrada é a abertura do candle 6
    expect(result.trades).toHaveLength(1);
    expect(result.trades[0]?.openedAt).toBe(new Date(6 * 60_000).toISOString());
    // curva e drawdown começam no período pedido, não no warm-up
    expect(result.equityCurve).toHaveLength(5);
    expect(result.equityCurve[0]?.time).toBe(new Date(candles[5]!.closeTime).toISOString());
    // hold ancorado na abertura do candle 5: 1000 × 109/105
    expect(result.summary.endingHoldEquityUsd).toBeCloseTo(1038.1, 1);
  });
});
