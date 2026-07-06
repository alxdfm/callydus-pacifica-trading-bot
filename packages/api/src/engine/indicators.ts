// ---------------------------------------------------------------------------
// Implementações puras dos indicadores (DT-005).
// A semântica replica exatamente a lib `technicalindicators` que substituem:
//   - SMA/EMA: output começa no índice period-1; EMA seeda com SMA inicial
//   - RSI: suavização de Wilder; a lib arredonda para 2 casas decimais
//   - ATR: true range só a partir do 2º candle; seed = SMA dos primeiros TRs
// Qualquer mudança aqui precisa passar nos golden tests de paridade.
// ---------------------------------------------------------------------------

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

function computeSma(values: number[], period: number): number[] {
  if (values.length < period) {
    return [];
  }

  const out: number[] = [];
  let windowSum = 0;

  for (let i = 0; i < values.length; i += 1) {
    windowSum += values[i]!;
    if (i >= period) {
      windowSum -= values[i - period]!;
    }
    if (i >= period - 1) {
      out.push(windowSum / period);
    }
  }

  return out;
}

function computeEma(values: number[], period: number): number[] {
  if (values.length < period) {
    return [];
  }

  const smoothing = 2 / (period + 1);
  let seed = 0;
  for (let i = 0; i < period; i += 1) {
    seed += values[i]!;
  }

  let ema = seed / period;
  const out: number[] = [ema];

  for (let i = period; i < values.length; i += 1) {
    ema = values[i]! * smoothing + ema * (1 - smoothing);
    out.push(ema);
  }

  return out;
}

function computeRsi(values: number[], period: number): number[] {
  if (values.length <= period) {
    return [];
  }

  let averageGain = 0;
  let averageLoss = 0;

  for (let i = 1; i <= period; i += 1) {
    const delta = values[i]! - values[i - 1]!;
    if (delta > 0) {
      averageGain += delta;
    } else {
      averageLoss -= delta;
    }
  }
  averageGain /= period;
  averageLoss /= period;

  const toRsi = (gain: number, loss: number): number => {
    // loss 0 → RSI 100 mesmo com gain 0 (paridade com a lib substituída)
    if (loss === 0) {
      return 100;
    }
    const rsi = 100 - 100 / (1 + gain / loss);
    // A lib arredonda o RSI para 2 casas — mantido pela paridade de sinais
    return Number.parseFloat(rsi.toFixed(2));
  };

  const out: number[] = [toRsi(averageGain, averageLoss)];

  for (let i = period + 1; i < values.length; i += 1) {
    const delta = values[i]! - values[i - 1]!;
    const gain = delta > 0 ? delta : 0;
    const loss = delta < 0 ? -delta : 0;
    averageGain = (averageGain * (period - 1) + gain) / period;
    averageLoss = (averageLoss * (period - 1) + loss) / period;
    out.push(toRsi(averageGain, averageLoss));
  }

  return out;
}

function computeAtr(
  highs: number[],
  lows: number[],
  closes: number[],
  period: number,
): number[] {
  // True range exige o close anterior, então a série de TR começa no índice 1
  const trueRanges: number[] = [];
  for (let i = 1; i < highs.length; i += 1) {
    const previousClose = closes[i - 1]!;
    trueRanges.push(
      Math.max(
        highs[i]! - lows[i]!,
        Math.abs(highs[i]! - previousClose),
        Math.abs(lows[i]! - previousClose),
      ),
    );
  }

  if (trueRanges.length < period) {
    return [];
  }

  let seed = 0;
  for (let i = 0; i < period; i += 1) {
    seed += trueRanges[i]!;
  }

  let atr = seed / period;
  const out: number[] = [atr];

  for (let i = period; i < trueRanges.length; i += 1) {
    atr = (atr * (period - 1) + trueRanges[i]!) / period;
    out.push(atr);
  }

  return out;
}

function computeDonchian(
  highs: number[],
  lows: number[],
  period: number,
  band: "upper" | "lower" | "middle",
): number[] {
  // Janela = os `period` candles ANTERIORES (exclui o atual): se o candle
  // atual entrasse na janela, price nunca cruzaria a própria máxima e as
  // regras de breakout (crossesAbove/Below) jamais disparariam.
  if (highs.length <= period) {
    return [];
  }

  const out: number[] = [];
  for (let i = period; i < highs.length; i += 1) {
    let upper = -Infinity;
    let lower = Infinity;
    for (let j = i - period; j < i; j += 1) {
      if (highs[j]! > upper) upper = highs[j]!;
      if (lows[j]! < lower) lower = lows[j]!;
    }
    out.push(
      band === "upper" ? upper : band === "lower" ? lower : (upper + lower) / 2,
    );
  }

  return out;
}

function computeAdx(
  highs: number[],
  lows: number[],
  closes: number[],
  period: number,
): number[] {
  // Wilder: +DM/-DM e TR começam no índice 1 (dependem do candle anterior)
  const plusDms: number[] = [];
  const minusDms: number[] = [];
  const trueRanges: number[] = [];

  for (let i = 1; i < highs.length; i += 1) {
    const upMove = highs[i]! - highs[i - 1]!;
    const downMove = lows[i - 1]! - lows[i]!;
    plusDms.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDms.push(downMove > upMove && downMove > 0 ? downMove : 0);

    const previousClose = closes[i - 1]!;
    trueRanges.push(
      Math.max(
        highs[i]! - lows[i]!,
        Math.abs(highs[i]! - previousClose),
        Math.abs(lows[i]! - previousClose),
      ),
    );
  }

  if (trueRanges.length < period) {
    return [];
  }

  // Suavização de Wilder (RMA) das três séries, seed = SMA dos primeiros N
  let smoothTr = 0;
  let smoothPlus = 0;
  let smoothMinus = 0;
  for (let i = 0; i < period; i += 1) {
    smoothTr += trueRanges[i]!;
    smoothPlus += plusDms[i]!;
    smoothMinus += minusDms[i]!;
  }
  smoothTr /= period;
  smoothPlus /= period;
  smoothMinus /= period;

  const toDx = (tr: number, plus: number, minus: number): number => {
    if (tr === 0) return 0;
    const plusDi = (100 * plus) / tr;
    const minusDi = (100 * minus) / tr;
    const diSum = plusDi + minusDi;
    return diSum === 0 ? 0 : (100 * Math.abs(plusDi - minusDi)) / diSum;
  };

  const dxs: number[] = [toDx(smoothTr, smoothPlus, smoothMinus)];

  for (let i = period; i < trueRanges.length; i += 1) {
    smoothTr = (smoothTr * (period - 1) + trueRanges[i]!) / period;
    smoothPlus = (smoothPlus * (period - 1) + plusDms[i]!) / period;
    smoothMinus = (smoothMinus * (period - 1) + minusDms[i]!) / period;
    dxs.push(toDx(smoothTr, smoothPlus, smoothMinus));
  }

  if (dxs.length < period) {
    return [];
  }

  let adx = 0;
  for (let i = 0; i < period; i += 1) {
    adx += dxs[i]!;
  }
  adx /= period;

  const out: number[] = [adx];
  for (let i = period; i < dxs.length; i += 1) {
    adx = (adx * (period - 1) + dxs[i]!) / period;
    out.push(adx);
  }

  return out;
}

export function calculateSmaSeries(values: number[], period: number): number[] {
  if (values.length === 0 || period < 1) {
    return createIndicatorNaNSeries(values.length);
  }
  return alignTrailingIndicatorSeries(computeSma(values, period), values.length);
}

export function calculateEmaSeries(values: number[], period: number): number[] {
  if (values.length === 0 || period < 1) {
    return createIndicatorNaNSeries(values.length);
  }
  return alignTrailingIndicatorSeries(computeEma(values, period), values.length);
}

export function calculateRsiSeries(values: number[], period: number): number[] {
  if (values.length === 0 || period < 1) {
    return createIndicatorNaNSeries(values.length);
  }
  return alignTrailingIndicatorSeries(computeRsi(values, period), values.length);
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
  return alignTrailingIndicatorSeries(
    computeAtr(highs, lows, closes, period),
    len,
  );
}

export function calculateDonchianSeries(
  highs: number[],
  lows: number[],
  period: number,
  band: "upper" | "lower" | "middle",
): number[] {
  const len = highs.length;
  if (len === 0 || period < 1 || len !== lows.length) {
    return createIndicatorNaNSeries(len);
  }
  return alignTrailingIndicatorSeries(
    computeDonchian(highs, lows, period, band),
    len,
  );
}

export function calculateAdxSeries(
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
  return alignTrailingIndicatorSeries(
    computeAdx(highs, lows, closes, period),
    len,
  );
}
