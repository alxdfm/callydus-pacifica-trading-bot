import { describe, it, expect } from "vitest";
import type { Candle, StrategyConfig, TriggerRule } from "@pacifica/shared";
import {
  evaluateSignal,
  buildRiskPlans,
  getRequiredPeriod,
  toPacificaMarketSymbol,
} from "../evaluator.js";
import {
  calculateSmaSeries,
  calculateEmaSeries,
  calculateRsiSeries,
  calculateAtrSeries,
  calculateDonchianSeries,
  calculateAdxSeries,
  calculateVolumeProfileSeries,
} from "../indicators.js";
import { indicatorGoldens } from "./indicator-goldens.js";

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

  it("resolves an indicator whose source is another indicator", () => {
    // Antes do fix a série encadeada saía toda NaN: a regra nunca era satisfeita
    // e a estratégia ficava sem disparar, sem erro nenhum
    const config = buildStrategyConfig({
      indicators: {
        EMA3: { type: "ema", period: 3 },
        SMA_OF_EMA3: { type: "sma", source: "EMA3", period: 2 },
      },
      longRules: [
        {
          scope: "currentCandle",
          type: "threshold",
          indicator: "EMA3",
          operator: "above",
          ref: "SMA_OF_EMA3",
        },
      ],
    });

    const result = evaluateSignal(config, buildCandles([10, 11, 12, 13, 14, 15, 16, 17]));

    expect(result.indicators.SMA_OF_EMA3?.current).toBeCloseTo(15.5, 9);
    expect(result.signal).toBe("long");
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

    expect(plans.long!.stopLossPrice).toBeCloseTo(98);
    expect(plans.long!.takeProfitPrice).toBeCloseTo(104);
    expect(plans.short!.stopLossPrice).toBeCloseTo(102);
    expect(plans.short!.takeProfitPrice).toBeCloseTo(96);
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

    expect(plans.long!.riskDistance).toBeCloseTo(3); // 2 * 1.5
    expect(plans.long!.stopLossPrice).toBeCloseTo(97);
    expect(plans.long!.takeProfitPrice).toBeCloseTo(109); // 100 + 3 * 3
  });

  it("anchors the stop on the value area edge — asymmetric per side", () => {
    // O TP é derivado da DISTÂNCIA do stop (modo rr), então ancorar o stop no
    // VAL/VAH move os DOIS lados do trade, não só o stop.
    const config = buildStrategyConfig({
      indicators: {
        VP_VAL: { type: "volumeProfile", period: 100, level: "val" },
        VP_VAH: { type: "volumeProfile", period: 100, level: "vah" },
      },
      stopLoss: { mode: "volumeProfile", period: 100, bufferPercent: 0 },
      takeProfitMultiple: 2,
    });

    const valueArea = {
      VP_VAL: { previous: 90, current: 90 },
      VP_VAH: { previous: 105, current: 105 },
    };

    // Rompimento PARA CIMA (entrada 110, acima da VAH): o long arrisca até a
    // VAL — 20 — e o alvo herda isso. O short não tem stop nenhum aqui: um stop
    // na VAH (105) ficaria ABAIXO da entrada, ou seja, seria um alvo, não um
    // stop. O lado é recusado em vez de inventado.
    const above = buildRiskPlans(config, valueArea, 110);
    expect(above.long!.riskDistance).toBeCloseTo(20);
    expect(above.long!.stopLossPrice).toBeCloseTo(90);
    expect(above.long!.takeProfitPrice).toBeCloseTo(150); // 110 + 20 * 2
    expect(above.short).toBeNull();

    // Rompimento PARA BAIXO (entrada 85): espelho exato — agora é o short que
    // tem stop (na VAH, 105) e o long que não existe
    const below = buildRiskPlans(config, valueArea, 85);
    expect(below.short!.riskDistance).toBeCloseTo(20);
    expect(below.short!.stopLossPrice).toBeCloseTo(105);
    expect(below.long).toBeNull();
  });

  it("pushes the stop past the level by the buffer", () => {
    const config = buildStrategyConfig({
      indicators: { VP_VAL: { type: "volumeProfile", period: 100, level: "val" } },
      stopLoss: { mode: "volumeProfile", period: 100, bufferPercent: 1 },
      takeProfitMultiple: 2,
    });

    // 1% de 100 = 1 de folga abaixo da VAL (90) → stop em 89, não em 90:
    // stop exatamente na borda fica onde a liquidez está parada
    const plans = buildRiskPlans(config, { VP_VAL: { previous: 90, current: 90 } }, 100);

    expect(plans.long!.stopLossPrice).toBeCloseTo(89);
    expect(plans.long!.riskDistance).toBeCloseTo(11);
  });

  it("returns null for a side with no valid stop instead of inventing one", () => {
    const config = buildStrategyConfig({
      indicators: {
        VP_VAL: { type: "volumeProfile", period: 100, level: "val" },
        VP_VAH: { type: "volumeProfile", period: 100, level: "vah" },
      },
      stopLoss: { mode: "volumeProfile", period: 100, bufferPercent: 0 },
    });

    // Preço DENTRO da value area [90, 105]: o long ainda tem stop (a VAL está
    // abaixo), mas o short precisaria de um stop na VAH... que também está
    // acima, então esse lado funciona. O caso sem stop é o preço ABAIXO da VAL:
    const insideVa = buildRiskPlans(
      config,
      { VP_VAL: { previous: 90, current: 90 }, VP_VAH: { previous: 105, current: 105 } },
      100,
    );
    expect(insideVa.long).not.toBeNull();
    expect(insideVa.short).not.toBeNull();

    // preço 85, abaixo da VAL → um stop de long em 90 ficaria ACIMA da entrada.
    // Isso não é erro: é mercado. O lado é recusado e o bot pula o trade
    // (invariante 3), em vez de abrir posição com proteção invertida.
    const belowVa = buildRiskPlans(
      config,
      { VP_VAL: { previous: 90, current: 90 }, VP_VAH: { previous: 105, current: 105 } },
      85,
    );
    expect(belowVa.long).toBeNull();
    expect(belowVa.short).not.toBeNull();
  });

  it("returns null while the profile is still warming up", () => {
    const config = buildStrategyConfig({
      indicators: { VP_VAL: { type: "volumeProfile", period: 100, level: "val" } },
      stopLoss: { mode: "volumeProfile", period: 100, bufferPercent: 0 },
    });

    // série ainda NaN → nenhum stop derivável → nenhum trade
    const plans = buildRiskPlans(config, { VP_VAL: { previous: null, current: null } }, 100);
    expect(plans.long).toBeNull();
    expect(plans.short).toBeNull();
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

// ---------------------------------------------------------------------------
// Indicadores puros — golden tests de paridade com technicalindicators@3.1.0
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
  const values = [10, 11, 12, 11.5, 13, 12.5, 14, 13.8, 15, 14.2];

  it("SMA/EMA start at index period-1; RSI/ATR at index period", () => {
    const sma = calculateSmaSeries(values, 3);
    const ema = calculateEmaSeries(values, 3);
    const rsi = calculateRsiSeries(values, 3);

    expect(sma[1]).toBeNaN();
    expect(sma[2]).toBeCloseTo(11, 9);
    expect(ema[2]).toBeCloseTo(11, 9);
    expect(ema[3]).toBeCloseTo(11.25, 9);
    expect(rsi[2]).toBeNaN();
    expect(rsi[3]).toBeCloseTo(80, 9);
  });

  it("RSI rounds to 2 decimals and returns 100 when there are no losses", () => {
    const rising = [1, 2, 3, 4, 5, 6, 7, 8];
    const flat = [5, 5, 5, 5, 5, 5];

    expect(calculateRsiSeries(rising, 3).at(-1)).toBe(100);
    expect(calculateRsiSeries(flat, 3).at(-1)).toBe(100);
  });

  it("ATR uses true range with gaps against previous close", () => {
    // gap de alta: TR deve usar |high - prevClose|, não high - low
    const highs = [11, 20];
    const lows = [9, 19];
    const closes = [10, 19.5];

    const atr = calculateAtrSeries(highs, lows, closes, 1);
    expect(atr[1]).toBeCloseTo(10, 9); // |20 - 10| domina
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
    expect(calculateSmaSeries([Number.NaN, Number.NaN], 2).every(Number.isNaN)).toBe(true);
    expect(calculateEmaSeries([1, 2], 0).every(Number.isNaN)).toBe(true);
    expect(calculateSmaSeries([1, 2], 5).every(Number.isNaN)).toBe(true);
    expect(calculateRsiSeries([1, 2, 3], 3).every(Number.isNaN)).toBe(true);
    // ATR com arrays de tamanhos diferentes é inválido → tudo NaN
    expect(calculateAtrSeries([1, 2, 3], [1, 2], [1, 2, 3], 1).every(Number.isNaN)).toBe(true);
  });
});

describe("calculateDonchianSeries", () => {
  const highs = [10, 12, 11, 15];
  const lows = [8, 9, 10, 13];

  it("computes bands over the PREVIOUS period candles (current excluded)", () => {
    const upper = calculateDonchianSeries(highs, lows, 2, "upper");
    const lower = calculateDonchianSeries(highs, lows, 2, "lower");
    const middle = calculateDonchianSeries(highs, lows, 2, "middle");

    expect(upper[0]).toBeNaN();
    expect(upper[1]).toBeNaN();
    expect(upper[2]).toBe(12); // max(h[0], h[1])
    expect(upper[3]).toBe(12); // max(h[1], h[2])
    expect(lower[2]).toBe(8); // min(l[0], l[1])
    expect(lower[3]).toBe(9); // min(l[1], l[2])
    expect(middle[2]).toBe(10);
    expect(middle[3]).toBe(10.5);
  });

  it("returns all-NaN when there are not enough candles", () => {
    expect(calculateDonchianSeries([1, 2], [1, 2], 2, "upper").every(Number.isNaN)).toBe(true);
    expect(calculateDonchianSeries([1, 2, 3], [1, 2], 2, "upper").every(Number.isNaN)).toBe(true);
  });
});

describe("calculateAdxSeries", () => {
  function trendCandles(closes: number[]) {
    return {
      highs: closes.map((c) => c + 1),
      lows: closes.map((c) => c - 1),
      closes,
    };
  }

  it("first value appears at index 2*period-1 and stays within [0, 100]", () => {
    const { highs, lows, closes } = trendCandles(
      Array.from({ length: 20 }, (_, i) => 100 + Math.sin(i) * 5),
    );
    const adx = calculateAdxSeries(highs, lows, closes, 3);

    for (let i = 0; i < 5; i += 1) {
      expect(adx[i]).toBeNaN();
    }
    for (let i = 5; i < adx.length; i += 1) {
      expect(adx[i]).toBeGreaterThanOrEqual(0);
      expect(adx[i]).toBeLessThanOrEqual(100);
    }
  });

  it("saturates at 100 in a one-directional trend and reads 0 in a flat market", () => {
    const up = trendCandles(Array.from({ length: 20 }, (_, i) => 100 + i * 2));
    expect(calculateAdxSeries(up.highs, up.lows, up.closes, 3).at(-1)).toBeCloseTo(100, 6);

    const flat = trendCandles(Array.from({ length: 20 }, () => 100));
    expect(calculateAdxSeries(flat.highs, flat.lows, flat.closes, 3).at(-1)).toBeCloseTo(0, 6);
  });

  it("scores a strong trend above a choppy market", () => {
    const trend = trendCandles(Array.from({ length: 30 }, (_, i) => 100 + i));
    const chop = trendCandles(
      Array.from({ length: 30 }, (_, i) => 100 + (i % 2 === 0 ? 3 : -3)),
    );

    const trendAdx = calculateAdxSeries(trend.highs, trend.lows, trend.closes, 5).at(-1)!;
    const chopAdx = calculateAdxSeries(chop.highs, chop.lows, chop.closes, 5).at(-1)!;

    expect(trendAdx).toBeGreaterThan(chopAdx);
  });

  it("returns all-NaN when there are not enough candles for double smoothing", () => {
    const { highs, lows, closes } = trendCandles(Array.from({ length: 5 }, (_, i) => 100 + i));
    // period 3 exige 2*3 = 6 candles → 5 é insuficiente
    expect(calculateAdxSeries(highs, lows, closes, 3).every(Number.isNaN)).toBe(true);
  });
});

// Espelho dos testes do engine da API — os dois pacotes duplicam o engine por
// design, então a semântica do volume profile é verificada nos dois lados.
describe("calculateVolumeProfileSeries", () => {
  // Candles achatados (h = l = c) para o preço típico cair exatamente no preço
  const flat = (prices: number[]) => ({ highs: prices, lows: prices, closes: prices });

  it("puts the POC on the heaviest price cluster, not the widest move", () => {
    const { highs, lows, closes } = flat([100, 100, 100, 100, 100, 100, 100, 120, 120]);
    const volumes = [10, 10, 10, 10, 10, 10, 10, 1, 1];

    const poc = calculateVolumeProfileSeries(highs, lows, closes, volumes, 8, "poc");
    // faixa da janela = [100, 120] / 24 faixas → o POC é o centro da 1ª faixa
    expect(poc[8]).toBeCloseTo(100 + 0.5 * (20 / 24), 6);
    expect(poc.slice(0, 8).every(Number.isNaN)).toBe(true);
  });

  it("ignores the current candle (same reason as donchian)", () => {
    // Volume ENORME a 120 no candle atual: se ele entrasse na janela o POC
    // saltaria para 120 e uma regra de PRICE cruzando o POC nunca dispararia.
    const { highs, lows, closes } = flat([100, 100, 100, 100, 100, 100, 100, 120, 120]);
    const volumes = [10, 10, 10, 10, 10, 10, 10, 1, 1000];

    const poc = calculateVolumeProfileSeries(highs, lows, closes, volumes, 8, "poc");
    expect(poc[8]).toBeCloseTo(100 + 0.5 * (20 / 24), 6);
  });

  it("brackets the POC with the value area (VAL <= POC <= VAH)", () => {
    const { highs, lows, closes } = flat([100, 101, 102, 103, 104, 105, 106, 107, 108]);
    const volumes = [1, 1, 1, 50, 50, 1, 1, 1, 1];

    const args = [highs, lows, closes, volumes, 8] as const;
    const val = calculateVolumeProfileSeries(...args, "val")[8]!;
    const poc = calculateVolumeProfileSeries(...args, "poc")[8]!;
    const vah = calculateVolumeProfileSeries(...args, "vah")[8]!;

    expect(val).toBeLessThanOrEqual(poc);
    expect(poc).toBeLessThanOrEqual(vah);
    expect(poc).toBeGreaterThan(102);
    expect(poc).toBeLessThan(105);
  });

  it("returns NaN for a window with no traded volume", () => {
    const { highs, lows, closes } = flat([100, 101, 102, 103, 104, 105, 106, 107, 108]);
    const volumes = Array.from({ length: 9 }, () => 0);
    // zero não pode virar "preço": uma regra de cruzamento o trataria como nível real
    expect(calculateVolumeProfileSeries(highs, lows, closes, volumes, 8, "poc")[8]).toBeNaN();
  });

  it("tail matches the full series (the engine's fast path)", () => {
    // O engine só calcula as 2 últimas posições porque cada uma custa O(period).
    // Se a cauda divergisse da série completa, o bot ao vivo estaria lendo um
    // indicador diferente do testado — este é O teste da otimização.
    const prices = Array.from({ length: 120 }, (_, i) => 100 + Math.sin(i / 7) * 12);
    const highs = prices.map((p) => p + 0.7);
    const lows = prices.map((p) => p - 0.9);
    const volumes = prices.map((_, i) => 10 + ((i * 37) % 23));

    for (const level of ["poc", "vah", "val"] as const) {
      const full = calculateVolumeProfileSeries(highs, lows, prices, volumes, 40, level);
      const tail = calculateVolumeProfileSeries(highs, lows, prices, volumes, 40, level, 2);

      expect(tail.at(-1)).toBe(full.at(-1));
      expect(tail.at(-2)).toBe(full.at(-2));
      expect(tail.slice(0, -2).every(Number.isNaN)).toBe(true);
    }
  });

  it("collapses the three levels on a flat window", () => {
    const { highs, lows, closes } = flat(Array.from({ length: 9 }, () => 100));
    const volumes = Array.from({ length: 9 }, () => 10);
    const args = [highs, lows, closes, volumes, 8] as const;

    expect(calculateVolumeProfileSeries(...args, "poc")[8]).toBe(100);
    expect(calculateVolumeProfileSeries(...args, "vah")[8]).toBe(100);
    expect(calculateVolumeProfileSeries(...args, "val")[8]).toBe(100);
  });
});

describe("evaluateSignal with donchian and adx", () => {
  it("fires a breakout signal when price crosses above the donchian upper band", () => {
    const config = buildStrategyConfig({
      indicators: { donchianUpper: { type: "donchian", period: 3, band: "upper" } },
      longRules: [
        {
          scope: "currentCandle",
          type: "cross",
          indicator: "PRICE",
          operator: "crossesAbove",
          ref: "donchianUpper",
        },
      ],
    });

    // banda superior = max(high dos 3 anteriores) = close+1 → 11; breakout em 15
    const breakout = evaluateSignal(config, buildCandles([10, 10, 10, 10, 15]));
    expect(breakout.signal).toBe("long");

    // sem breakout: preço segue dentro do canal
    const inside = evaluateSignal(config, buildCandles([10, 10, 10, 10, 10.5]));
    expect(inside.signal).toBe("none");
  });

  it("uses adx as a regime filter via threshold rules", () => {
    const config = buildStrategyConfig({
      indicators: { adx5: { type: "adx", period: 5 } },
      longRules: [
        {
          scope: "currentCandle",
          type: "threshold",
          indicator: "adx5",
          operator: "above",
          value: 25,
        },
      ],
    });

    const trending = Array.from({ length: 30 }, (_, i) => 100 + i);
    const flat = Array.from({ length: 30 }, () => 100);

    expect(evaluateSignal(config, buildCandles(trending)).signal).toBe("long");
    expect(evaluateSignal(config, buildCandles(flat)).signal).toBe("none");
  });

  it("getRequiredPeriod accounts for donchian exclusion window and adx double smoothing", () => {
    const config = buildStrategyConfig({
      indicators: {
        donchianUpper: { type: "donchian", period: 20, band: "upper" },
        adx14: { type: "adx", period: 14 },
      },
    });

    expect(getRequiredPeriod(config)).toBe(28); // adx 14*2 > donchian 20+1
  });
});
