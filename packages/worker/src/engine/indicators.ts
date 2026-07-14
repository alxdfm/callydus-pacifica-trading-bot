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

/**
 * Index of the first finite value. Series fed to SMA/EMA can be another
 * indicator's output, which is NaN-padded while it warms up — the rolling sum
 * and the EMA seed would carry that NaN forever, so the warm-up prefix has to
 * be dropped before computing.
 */
function firstFiniteIndex(values: number[]): number {
  for (let i = 0; i < values.length; i += 1) {
    if (Number.isFinite(values[i]!)) {
      return i;
    }
  }
  return values.length;
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

// Nº de faixas de preço do volume profile. Fixo de propósito: é resolução, não
// preferência, e deixar o usuário mexer só abriria espaço para overfit.
const VOLUME_PROFILE_BINS = 24;
// Convenção do Market Profile: a value area é o miolo que concentra 70% do volume
const VOLUME_PROFILE_VALUE_AREA_RATIO = 0.7;

function computeVolumeProfile(
  highs: number[],
  lows: number[],
  closes: number[],
  volumes: number[],
  period: number,
  level: "poc" | "vah" | "val",
  tailPositions: number,
): number[] {
  // Janela = os `period` candles ANTERIORES (exclui o atual), mesma razão do
  // donchian: com o candle atual dentro da janela o volume dele próprio puxaria
  // o POC, e uma regra de PRICE cruzando o POC nunca dispararia limpa.
  if (highs.length <= period) {
    return [];
  }

  // Cada posição custa O(period) para re-binar a janela — diferente de EMA/RSI,
  // que são O(1) por posição. Calcular a série toda a cada candle do backtest
  // custava 14s de binning puro em 60k candles; `tailPositions` limita o cálculo
  // às posições que o engine de fato lê (ver INDICATOR_TAIL_POSITIONS).
  const firstPosition = Math.max(period, highs.length - tailPositions);

  const out: number[] = [];
  const binVolumes = new Array<number>(VOLUME_PROFILE_BINS).fill(0);

  // Deques monotônicas dão o max/min da janela deslizante em O(1) amortizado
  const maxDeque: number[] = [];
  const minDeque: number[] = [];
  let maxHead = 0;
  let minHead = 0;
  let totalVolume = 0;

  function pushRange(index: number): void {
    while (
      maxDeque.length > maxHead &&
      highs[maxDeque[maxDeque.length - 1]!]! <= highs[index]!
    ) {
      maxDeque.pop();
    }
    maxDeque.push(index);

    while (
      minDeque.length > minHead &&
      lows[minDeque[minDeque.length - 1]!]! >= lows[index]!
    ) {
      minDeque.pop();
    }
    minDeque.push(index);
  }

  // Semeia a janela [firstPosition - period, firstPosition)
  for (let j = firstPosition - period; j < firstPosition; j += 1) {
    pushRange(j);
    totalVolume += volumes[j]!;
  }

  for (let i = firstPosition; i < highs.length; i += 1) {
    // Invariante: ao entrar na iteração as deques e o totalVolume cobrem
    // exatamente a janela [i - period, i) — o candle atual fica de fora
    const rangeHigh = highs[maxDeque[maxHead]!]!;
    const rangeLow = lows[minDeque[minHead]!]!;

    out.push(
      resolveLevel(i, rangeLow, rangeHigh, totalVolume, binVolumes, level, {
        highs,
        lows,
        closes,
        volumes,
        period,
      }),
    );

    // Desliza a janela: sai o candle i - period, entra o candle i
    const leaving = i - period;
    totalVolume = totalVolume - volumes[leaving]! + volumes[i]!;
    if (maxDeque[maxHead] === leaving) maxHead += 1;
    if (minDeque[minHead] === leaving) minHead += 1;
    pushRange(i);
  }

  return out;
}

function resolveLevel(
  i: number,
  rangeLow: number,
  rangeHigh: number,
  totalVolume: number,
  binVolumes: number[],
  level: "poc" | "vah" | "val",
  series: {
    highs: number[];
    lows: number[];
    closes: number[];
    volumes: number[];
    period: number;
  },
): number {
  const { highs, lows, closes, volumes, period } = series;

  // Janela achatada (todos os candles no mesmo preço): os três níveis colapsam
  if (!(rangeHigh > rangeLow)) {
    return Number.isFinite(rangeHigh) ? rangeHigh : Number.NaN;
  }

  // Sem volume negociado o perfil não tem o que dizer — NaN, e não zero: zero
  // seria um "preço" e as regras de cruzamento o tratariam como nível real
  if (totalVolume <= 0) {
    return Number.NaN;
  }

  binVolumes.fill(0);
  const binWidth = (rangeHigh - rangeLow) / VOLUME_PROFILE_BINS;

  for (let j = i - period; j < i; j += 1) {
    // Sem tick data não sabemos ONDE dentro do candle o volume negociou;
    // espalhá-lo pelo range H–L inventaria precisão que o dado não tem. Cada
    // candle entra como massa pontual no preço típico (h+l+c)/3.
    const typicalPrice = (highs[j]! + lows[j]! + closes[j]!) / 3;
    const bin = Math.min(
      VOLUME_PROFILE_BINS - 1,
      Math.floor((typicalPrice - rangeLow) / binWidth),
    );
    binVolumes[bin] = binVolumes[bin]! + volumes[j]!;
  }

  let pocBin = 0;
  for (let bin = 1; bin < VOLUME_PROFILE_BINS; bin += 1) {
    if (binVolumes[bin]! > binVolumes[pocBin]!) {
      pocBin = bin;
    }
  }

  if (level === "poc") {
    return rangeLow + (pocBin + 0.5) * binWidth;
  }

  // Value area: expande do POC sempre para o vizinho de maior volume até cobrir
  // os 70%. O laço sempre termina — a soma das faixas é o totalVolume.
  let lowBin = pocBin;
  let highBin = pocBin;
  let covered = binVolumes[pocBin]!;
  const target = totalVolume * VOLUME_PROFILE_VALUE_AREA_RATIO;

  while (covered < target && (lowBin > 0 || highBin < VOLUME_PROFILE_BINS - 1)) {
    const below = lowBin > 0 ? binVolumes[lowBin - 1]! : -1;
    const above =
      highBin < VOLUME_PROFILE_BINS - 1 ? binVolumes[highBin + 1]! : -1;

    if (above >= below) {
      highBin += 1;
      covered += above;
    } else {
      lowBin -= 1;
      covered += below;
    }
  }

  return level === "vah"
    ? rangeLow + (highBin + 1) * binWidth
    : rangeLow + lowBin * binWidth;
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
  const start = firstFiniteIndex(values);
  return alignTrailingIndicatorSeries(
    computeSma(values.slice(start), period),
    values.length,
  );
}

export function calculateEmaSeries(values: number[], period: number): number[] {
  if (values.length === 0 || period < 1) {
    return createIndicatorNaNSeries(values.length);
  }
  const start = firstFiniteIndex(values);
  return alignTrailingIndicatorSeries(
    computeEma(values.slice(start), period),
    values.length,
  );
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

/**
 * Volume profile of the PREVIOUS `period` candles, emitted as a price (POC or a
 * value-area edge) and aligned to the input length.
 *
 * Unlike every other indicator here, each position costs O(period) — the price
 * bins are relative to the window, so they cannot be slid incrementally.
 * `tailPositions` caps how many trailing positions are actually computed;
 * earlier ones stay NaN. The engine only ever reads the last two values of a
 * series (currentCandle/previousCandle), and computing the rest turned a
 * 60k-candle backtest into 14s of pure binning. Omit it for the full series.
 */
export function calculateVolumeProfileSeries(
  highs: number[],
  lows: number[],
  closes: number[],
  volumes: number[],
  period: number,
  level: "poc" | "vah" | "val",
  tailPositions: number = Number.POSITIVE_INFINITY,
): number[] {
  const len = highs.length;
  if (len === 0 || period < 1 || tailPositions < 1) {
    return createIndicatorNaNSeries(len);
  }
  if (
    len !== lows.length ||
    len !== closes.length ||
    len !== volumes.length
  ) {
    return createIndicatorNaNSeries(len);
  }
  return alignTrailingIndicatorSeries(
    computeVolumeProfile(
      highs,
      lows,
      closes,
      volumes,
      period,
      level,
      tailPositions,
    ),
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
