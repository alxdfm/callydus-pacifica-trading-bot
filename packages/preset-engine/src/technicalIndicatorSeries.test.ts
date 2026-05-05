import { describe, expect, it } from "vitest";
import {
  calculateAtrSeries,
  calculateEmaSeries,
  calculateRsiSeries,
  calculateSmaSeries,
  createIndicatorNaNSeries,
} from "./technicalIndicatorSeries";

describe("technicalIndicatorSeries", () => {
  it("pads SMA with leading NaN to match input length", () => {
    const values = [1, 2, 3, 4, 5];
    const sma = calculateSmaSeries(values, 3);
    expect(sma).toHaveLength(5);
    expect(Number.isNaN(sma[0])).toBe(true);
    expect(Number.isNaN(sma[1])).toBe(true);
    expect(sma[2]).toBe(2);
    expect(sma[4]).toBe(4);
  });

  it("aligns RSI to the end of the series", () => {
    const values = [10, 11, 12, 11, 10, 9, 10];
    const rsi = calculateRsiSeries(values, 3);
    expect(rsi).toHaveLength(7);
    expect(Number.isFinite(rsi.at(-1)!)).toBe(true);
  });

  it("returns NaN-only series for empty input", () => {
    expect(calculateEmaSeries([], 14)).toEqual([]);
    expect(createIndicatorNaNSeries(3).every(Number.isNaN)).toBe(true);
  });

  it("computes ATR aligned to highs/lows/closes length", () => {
    const h = [5, 6, 7, 6];
    const l = [3, 4, 5, 4];
    const c = [4, 5, 6, 5];
    const atr = calculateAtrSeries(h, l, c, 2);
    expect(atr).toHaveLength(4);
    expect(Number.isFinite(atr.at(-1)!)).toBe(true);
  });
});
