// Busca de candles da Pacifica em janelas — a API limita cada request de
// /api/v1/kline a 4000 candles, então períodos longos são buscados em chunks
// paralelos (concorrência limitada para respeitar o provider) e deduplicados
// por openTime

export type FetchedCandle = {
  symbol: string;
  interval: string;
  openTime: number;
  closeTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

const MAX_CANDLES_PER_REQUEST = 4000;
const MAX_CONCURRENT_CHUNKS = 3;

// CÓPIA DELIBERADA: o parse de linha do kline é gêmeo do parseKlinePayload em
// packages/worker/src/candle-fetch.ts (worker não importa da api). Mudança de
// shape no endpoint deve pousar NOS DOIS arquivos.
async function fetchChunk(input: {
  baseUrl: string;
  symbol: string;
  timeframe: string;
  startTime: number;
  endTime: number;
}): Promise<FetchedCandle[] | null> {
  // Qualquer falha do provider (rede, status, corpo não-JSON) vira `null` —
  // a rota traduz isso em 503 provider_unavailable retryable
  let rawPayload: unknown;

  try {
    const response = await fetch(
      `${input.baseUrl}/api/v1/kline?symbol=${input.symbol}&interval=${input.timeframe}&start_time=${input.startTime}&end_time=${input.endTime}`,
      { headers: { Accept: "application/json" } },
    );

    if (!response.ok) return null;

    rawPayload = (await response.json()) as unknown;
  } catch {
    return null;
  }

  const rawData =
    rawPayload && typeof rawPayload === "object" && "data" in rawPayload
      ? (rawPayload as { data?: unknown }).data
      : rawPayload;

  if (!Array.isArray(rawData)) return null;

  const candles: FetchedCandle[] = [];

  for (const item of rawData) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const openTime = Number(row.t);
    const closeTime = Number(row.T);
    const open = Number(row.o);
    const high = Number(row.h);
    const low = Number(row.l);
    const close = Number(row.c);
    const volume = Number(row.v ?? 0);

    if (
      !Number.isFinite(openTime) ||
      !Number.isFinite(closeTime) ||
      !Number.isFinite(open) ||
      !Number.isFinite(high) ||
      !Number.isFinite(low) ||
      !Number.isFinite(close)
    ) {
      continue;
    }

    candles.push({
      symbol: input.symbol,
      interval: input.timeframe,
      openTime,
      closeTime,
      open,
      high,
      low,
      close,
      volume,
    });
  }

  return candles;
}

export async function fetchCandlesInChunks(input: {
  baseUrl: string;
  symbol: string;
  timeframe: string;
  startTime: number;
  endTime: number;
  intervalMs: number;
}): Promise<FetchedCandle[] | null> {
  const baseUrl = input.baseUrl.replace(/\/+$/, "");
  const chunkMs = MAX_CANDLES_PER_REQUEST * input.intervalMs;
  const ranges: { start: number; end: number }[] = [];

  for (
    let chunkStart = Math.max(0, input.startTime);
    chunkStart < input.endTime;
    chunkStart += chunkMs
  ) {
    ranges.push({
      start: chunkStart,
      end: Math.min(chunkStart + chunkMs, input.endTime),
    });
  }

  const candlesByOpenTime = new Map<number, FetchedCandle>();

  for (let i = 0; i < ranges.length; i += MAX_CONCURRENT_CHUNKS) {
    const batch = ranges.slice(i, i + MAX_CONCURRENT_CHUNKS);
    const results = await Promise.all(
      batch.map((range) =>
        fetchChunk({
          baseUrl,
          symbol: input.symbol,
          timeframe: input.timeframe,
          startTime: range.start,
          endTime: range.end,
        }),
      ),
    );

    for (const result of results) {
      if (result === null) return null;
      for (const candle of result) {
        candlesByOpenTime.set(candle.openTime, candle);
      }
    }
  }

  return [...candlesByOpenTime.values()].sort((a, b) => a.openTime - b.openTime);
}
