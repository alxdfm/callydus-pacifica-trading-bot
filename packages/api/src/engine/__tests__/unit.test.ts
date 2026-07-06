import { describe, it, expect } from "vitest";
import {
  calculateSmaSeries,
  calculateEmaSeries,
  calculateRsiSeries,
  calculateAtrSeries,
} from "../indicators.js";
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

  it("returns all-NaN series for empty input, period < 1 or insufficient data", () => {
    expect(calculateSmaSeries([], 3)).toEqual([]);
    expect(calculateEmaSeries([1, 2], 0).every(Number.isNaN)).toBe(true);
    expect(calculateSmaSeries([1, 2], 5).every(Number.isNaN)).toBe(true);
    expect(calculateAtrSeries([1, 2, 3], [1, 2], [1, 2, 3], 1).every(Number.isNaN)).toBe(true);
  });
});
