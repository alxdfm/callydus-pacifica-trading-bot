import { describe, it, expect } from "vitest";
import type { Candle, StrategyConfig, TriggerRule } from "@pacifica/shared";
import {
  evaluateSignal,
  buildRiskPlans,
  getRequiredPeriod,
  toPacificaMarketSymbol,
} from "../evaluator.js";

function buildCandles(closes: number[]): Candle[] {
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

function buildStrategyConfig(overrides: {
  indicators?: StrategyConfig["indicators"];
  longRules?: TriggerRule[];
  shortRules?: TriggerRule[];
  longEnabled?: boolean;
  shortEnabled?: boolean;
  stopLoss?: StrategyConfig["risk"]["stopLoss"];
  takeProfitMultiple?: number;
}): StrategyConfig {
  return {
    name: "test-strategy",
    version: 1,
    timeframe: "1m",
    symbol: "BTC/USDC",
    indicators: overrides.indicators ?? {},
    entry: {
      long: {
        enabled: overrides.longEnabled ?? overrides.longRules !== undefined,
        trigger: { type: "all", rules: overrides.longRules ?? [] },
      },
      short: {
        enabled: overrides.shortEnabled ?? overrides.shortRules !== undefined,
        trigger: { type: "all", rules: overrides.shortRules ?? [] },
      },
    },
    risk: {
      stopLoss: overrides.stopLoss ?? { mode: "static", value: 2, unit: "percent" },
      takeProfit: { mode: "rr", multiple: overrides.takeProfitMultiple ?? 2 },
    },
    execution: {
      positionSize: { type: "fixedPercent", value: 10 },
      onePositionPerSymbol: true,
      manualCloseAllowed: true,
      closeOppositePositionOnSignal: false,
    },
  };
}

describe("evaluateSignal", () => {
  it("emits long when a threshold rule on PRICE is satisfied", () => {
    const config = buildStrategyConfig({
      longRules: [
        {
          scope: "currentCandle",
          type: "threshold",
          indicator: "PRICE",
          operator: "above",
          value: 100,
        },
      ],
    });

    const result = evaluateSignal(config, buildCandles([98, 99, 105]));

    expect(result.signal).toBe("long");
    expect(result.longSignal).toBe(true);
    expect(result.shortSignal).toBe(false);
    expect(result.longRuleEvaluations[0]?.satisfied).toBe(true);
  });

  it("does not emit when the threshold rule is not satisfied", () => {
    const config = buildStrategyConfig({
      longRules: [
        {
          scope: "currentCandle",
          type: "threshold",
          indicator: "PRICE",
          operator: "above",
          value: 100,
        },
      ],
    });

    const result = evaluateSignal(config, buildCandles([98, 99, 99.5]));

    expect(result.signal).toBe("none");
  });

  it("emits long on crossesAbove only when the cross happens", () => {
    const rule: TriggerRule = {
      scope: "currentCandle",
      type: "cross",
      indicator: "PRICE",
      operator: "crossesAbove",
      value: 100,
    };
    const config = buildStrategyConfig({ longRules: [rule] });

    // previous <= 100 e current > 100 → cross
    expect(evaluateSignal(config, buildCandles([95, 99, 101])).signal).toBe("long");
    // já estava acima → sem cross
    expect(evaluateSignal(config, buildCandles([95, 101, 102])).signal).toBe("none");
  });

  it("returns none when long and short fire simultaneously", () => {
    const rule: TriggerRule = {
      scope: "currentCandle",
      type: "threshold",
      indicator: "PRICE",
      operator: "above",
      value: 100,
    };
    const config = buildStrategyConfig({ longRules: [rule], shortRules: [rule] });

    const result = evaluateSignal(config, buildCandles([101, 102, 103]));

    expect(result.signal).toBe("none");
    expect(result.longSignal).toBe(true);
    expect(result.shortSignal).toBe(true);
  });

  it("ignores disabled sides and empty rule groups", () => {
    const config = buildStrategyConfig({
      longEnabled: true,
      shortEnabled: false,
    });

    const result = evaluateSignal(config, buildCandles([101, 102, 103]));

    expect(result.signal).toBe("none");
    expect(result.longRuleEvaluations).toEqual([]);
  });

  it("does not fire threshold rules when the indicator has insufficient data", () => {
    const config = buildStrategyConfig({
      indicators: { emaFast: { type: "ema", period: 50 } },
      longRules: [
        {
          scope: "currentCandle",
          type: "threshold",
          indicator: "PRICE",
          operator: "above",
          ref: "emaFast",
        },
      ],
    });

    // 3 candles < período 50 → EMA é NaN → regra não pode ser satisfeita
    const result = evaluateSignal(config, buildCandles([101, 102, 103]));

    expect(result.signal).toBe("none");
    expect(result.indicators["emaFast"]).toEqual({ previous: null, current: null });
  });
});

describe("buildRiskPlans", () => {
  it("builds symmetric long/short plans with static stop loss", () => {
    const config = buildStrategyConfig({
      stopLoss: { mode: "static", value: 2, unit: "percent" },
      takeProfitMultiple: 2,
    });

    const plans = buildRiskPlans(config, {}, 100);

    expect(plans.long.stopLossPrice).toBeCloseTo(98);
    expect(plans.long.takeProfitPrice).toBeCloseTo(104);
    expect(plans.short.stopLossPrice).toBeCloseTo(102);
    expect(plans.short.takeProfitPrice).toBeCloseTo(96);
  });

  it("derives risk distance from ATR when configured", () => {
    const config = buildStrategyConfig({
      indicators: { atr14: { type: "atr", period: 14 } },
      stopLoss: { mode: "atr", period: 14, multiplier: 1.5 },
      takeProfitMultiple: 3,
    });

    const plans = buildRiskPlans(
      config,
      { atr14: { previous: 1.9, current: 2 } },
      100,
    );

    expect(plans.long.riskDistance).toBeCloseTo(3); // 2 * 1.5
    expect(plans.long.stopLossPrice).toBeCloseTo(97);
    expect(plans.long.takeProfitPrice).toBeCloseTo(109); // 100 + 3 * 3
  });

  it("throws when ATR stop loss cannot be derived", () => {
    const config = buildStrategyConfig({
      stopLoss: { mode: "atr", period: 14, multiplier: 1.5 },
    });

    expect(() => buildRiskPlans(config, {}, 100)).toThrow(
      /ATR-based stop loss/,
    );
  });
});

describe("getRequiredPeriod", () => {
  it("returns the longest lookback across indicators and stop loss", () => {
    const config = buildStrategyConfig({
      indicators: {
        emaFast: { type: "ema", period: 9 },
        emaSlow: { type: "ema", period: 21 },
        vol: { type: "volume" },
      },
      stopLoss: { mode: "atr", period: 14, multiplier: 1 },
    });

    expect(getRequiredPeriod(config)).toBe(21);
  });
});

describe("toPacificaMarketSymbol", () => {
  it("extracts the base asset from UI symbols", () => {
    expect(toPacificaMarketSymbol("BTC/USDC")).toBe("BTC");
    expect(toPacificaMarketSymbol("SOL/USDC")).toBe("SOL");
  });

  it("returns null for unsupported formats", () => {
    expect(toPacificaMarketSymbol("BTC/USDT")).toBeNull();
    expect(toPacificaMarketSymbol("btc/usdc")).toBeNull();
    expect(toPacificaMarketSymbol("BTC")).toBeNull();
  });
});
