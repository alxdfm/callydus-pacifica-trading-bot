import type { Candle, CandleInterval } from "@pacifica/shared";

// ---------------------------------------------------------------------------
// Busca de candles via REST (/api/v1/kline) — era o warm-up do ws-feed.
// No modelo de execução agendada este fetch é a ÚNICA fonte de candles: cada
// invocação reconstrói o buffer do zero a partir do histórico da exchange.
// ---------------------------------------------------------------------------

type CandleFetchLogger = {
  info: (...a: unknown[]) => void;
  error: (...a: unknown[]) => void;
};

const defaultLogger: CandleFetchLogger = {
  info: (...a) => console.info(...a),
  error: (...a) => console.error(...a),
};

/** Mesma tolerância de shape do warm-up antigo: aceita camelCase, snake_case e o formato compacto do WS. */
export function parseKlinePayload(
  payload: unknown,
  symbol: string,
  interval: CandleInterval,
): Candle[] {
  const data =
    payload && typeof payload === "object" && "data" in payload
      ? (payload as { data?: unknown }).data
      : payload;

  if (!Array.isArray(data)) return [];

  const candles: Candle[] = [];

  for (const item of data) {
    if (!item || typeof item !== "object") continue;

    const row = item as Record<string, unknown>;
    const candle: Candle = {
      symbol,
      interval,
      openTime: Number(row.openTime ?? row.open_time ?? row.t),
      closeTime: Number(row.closeTime ?? row.close_time ?? row.T),
      open: Number(row.open ?? row.o),
      high: Number(row.high ?? row.h),
      low: Number(row.low ?? row.l),
      close: Number(row.close ?? row.c),
      volume: Number(row.volume ?? row.v ?? 0),
    };

    if (
      Number.isFinite(candle.openTime) &&
      Number.isFinite(candle.closeTime) &&
      Number.isFinite(candle.open) &&
      Number.isFinite(candle.high) &&
      Number.isFinite(candle.low) &&
      Number.isFinite(candle.close)
    ) {
      candles.push(candle);
    }
  }

  return candles;
}

/**
 * Busca as últimas `count` velas de um par. Falha de rede/HTTP devolve `[]` —
 * quem decide se dá para avaliar com o que sobrou é o bot (checagem de
 * candles mínimos), não o fetch.
 */
export async function fetchCandles(input: {
  restBaseUrl: string;
  symbol: string;
  interval: CandleInterval;
  intervalMs: number;
  count: number;
  logger?: CandleFetchLogger;
}): Promise<Candle[]> {
  const logger = input.logger ?? defaultLogger;
  const restBaseUrl = input.restBaseUrl.replace(/\/+$/, "");

  try {
    // /api/v1/kline exige start_time; o range cobre as N velas pedidas
    const endTime = Date.now();
    const params = new URLSearchParams({
      symbol: input.symbol,
      interval: input.interval,
      start_time: String(endTime - input.count * input.intervalMs),
      end_time: String(endTime),
    });
    const response = await fetch(
      `${restBaseUrl}/api/v1/kline?${params.toString()}`,
      { headers: { Accept: "application/json" } },
    );

    if (!response.ok) {
      logger.error("[candle-fetch] kline request failed", {
        symbol: input.symbol,
        interval: input.interval,
        status: response.status,
      });
      return [];
    }

    const payload = (await response.json()) as unknown;
    return parseKlinePayload(payload, input.symbol, input.interval);
  } catch (err) {
    logger.error("[candle-fetch] kline request error", {
      symbol: input.symbol,
      interval: input.interval,
      err,
    });
    return [];
  }
}
