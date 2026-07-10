// Busca de candles da Pacifica em janelas — a API limita cada request de
// /api/v1/kline a 4000 candles, então períodos longos são buscados em chunks
// sequenciais e deduplicados por openTime

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
  const candlesByOpenTime = new Map<number, FetchedCandle>();

  for (
    let chunkStart = Math.max(0, input.startTime);
    chunkStart < input.endTime;
    chunkStart += chunkMs
  ) {
    const chunkEnd = Math.min(chunkStart + chunkMs, input.endTime);
    const response = await fetch(
      `${baseUrl}/api/v1/kline?symbol=${input.symbol}&interval=${input.timeframe}&start_time=${chunkStart}&end_time=${chunkEnd}`,
      { headers: { Accept: "application/json" } },
    );

    if (!response.ok) return null;

    const rawPayload = (await response.json()) as unknown;
    const rawData =
      rawPayload && typeof rawPayload === "object" && "data" in rawPayload
        ? (rawPayload as { data?: unknown }).data
        : rawPayload;

    if (!Array.isArray(rawData)) return null;

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

      candlesByOpenTime.set(openTime, {
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
  }

  return [...candlesByOpenTime.values()].sort((a, b) => a.openTime - b.openTime);
}
