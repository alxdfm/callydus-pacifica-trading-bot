import { ATR, EMA, RSI, SMA } from "technicalindicators";

/**
 * Series aligned to input length: leading positions are NaN until the
 * indicator has enough data (matches prior preset-engine behavior).
 */
export function createIndicatorNaNSeries(length: number): number[] {
  return Array.from({ length }, () => Number.NaN);
}

function alignTrailingIndicatorSeries(
  computed: number[],
  fullLength: number,
): number[] {
  const out = createIndicatorNaNSeries(fullLength);
  if (computed.length === 0 || fullLength === 0) {
    return out;
  }
  const offset = fullLength - computed.length;
  for (let i = 0; i < computed.length; i += 1) {
    out[offset + i] = computed[i]!;
  }
  return out;
}

export function calculateSmaSeries(values: number[], period: number): number[] {
  if (values.length === 0 || period < 1) {
    return createIndicatorNaNSeries(values.length);
  }
  const raw = SMA.calculate({ period, values });
  return alignTrailingIndicatorSeries(raw, values.length);
}

export function calculateEmaSeries(values: number[], period: number): number[] {
  if (values.length === 0 || period < 1) {
    return createIndicatorNaNSeries(values.length);
  }
  const raw = EMA.calculate({ period, values });
  return alignTrailingIndicatorSeries(raw, values.length);
}

export function calculateRsiSeries(values: number[], period: number): number[] {
  if (values.length === 0 || period < 1) {
    return createIndicatorNaNSeries(values.length);
  }
  const raw = RSI.calculate({ period, values });
  return alignTrailingIndicatorSeries(raw, values.length);
}

export function calculateAtrSeries(
  highs: number[],
  lows: number[],
  closes: number[],
  period: number,
): number[] {
  const len = highs.length;
  if (len === 0 || period < 1) {
    return createIndicatorNaNSeries(len);
  }
  if (len !== lows.length || len !== closes.length) {
    return createIndicatorNaNSeries(len);
  }
  const raw = ATR.calculate({
    period,
    high: highs,
    low: lows,
    close: closes,
  });
  return alignTrailingIndicatorSeries(raw, len);
}
