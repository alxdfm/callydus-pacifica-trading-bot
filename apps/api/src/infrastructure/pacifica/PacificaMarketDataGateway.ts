import type {
  MarketCandle,
  MarketCandleInterval,
  MarketCandleRequest,
  MarketPriceSnapshot,
} from "@pacifica/contracts";
import type { MarketDataPort } from "../../domain/market-data/MarketDataPort";
import type { ApiEnvironment } from "../config/createApiEnvironment";
import { PacificaApiError } from "./PacificaClient";

type PacificaMarketDataGatewayInput = Pick<ApiEnvironment, "pacificaRestBaseUrl">;

export class PacificaMarketDataGateway implements MarketDataPort {
  private readonly apiBaseUrl: string;

  constructor(input: PacificaMarketDataGatewayInput) {
    this.apiBaseUrl = input.pacificaRestBaseUrl.endsWith("/")
      ? input.pacificaRestBaseUrl.slice(0, -1)
      : input.pacificaRestBaseUrl;
  }

  async getPrices(): Promise<MarketPriceSnapshot[]> {
    const response = await fetch(`${this.apiBaseUrl}/api/v1/info/prices`);
    const payload = await parseResponseBody(response);

    if (!response.ok) {
      throw new PacificaApiError(
        `Pacifica API request failed (${response.status}).`,
        {
          status: response.status,
          body: payload,
          retryable: response.status === 429 || response.status >= 500,
        },
      );
    }

    return normalizePrices(payload);
  }

  async getCandles(input: MarketCandleRequest): Promise<MarketCandle[]> {
    const endTime = normalizeEndTime(input);
    const params = new URLSearchParams({
      symbol: input.symbol,
      interval: mapInterval(input.interval),
      start_time: String(input.startTime),
    });

    if (typeof endTime === "number") {
      params.set("end_time", String(endTime));
    }

    const path =
      input.priceSource === "mark" ? "/api/v1/kline/mark" : "/api/v1/kline";
    const response = await fetch(`${this.apiBaseUrl}${path}?${params.toString()}`);
    const payload = await parseResponseBody(response);

    if (!response.ok) {
      throw new PacificaApiError(
        `Pacifica API request failed (${response.status}).`,
        {
          status: response.status,
          body: payload,
          retryable: response.status === 429 || response.status >= 500,
        },
      );
    }

    return normalizeCandles(payload, input.symbol, input.interval);
  }
}

function mapInterval(interval: MarketCandleInterval): string {
  return interval;
}

function intervalToMilliseconds(interval: MarketCandleInterval): number {
  switch (interval) {
    case "1m":
      return 60_000;
    case "3m":
      return 3 * 60_000;
    case "5m":
      return 5 * 60_000;
    case "15m":
      return 15 * 60_000;
    case "30m":
      return 30 * 60_000;
    case "1h":
      return 60 * 60_000;
    case "2h":
      return 2 * 60 * 60_000;
    case "4h":
      return 4 * 60 * 60_000;
    case "6h":
      return 6 * 60 * 60_000;
    case "12h":
      return 12 * 60 * 60_000;
    case "1d":
      return 24 * 60 * 60_000;
  }
}

function normalizeEndTime(input: MarketCandleRequest): number | undefined {
  if (typeof input.endTime === "number") {
    return input.endTime;
  }

  if (typeof input.limit === "number") {
    const intervalMs = intervalToMilliseconds(input.interval);
    return input.startTime + intervalMs * input.limit;
  }

  return undefined;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const raw = await response.text();
  return raw ? { raw } : null;
}

function normalizePrices(payload: unknown): MarketPriceSnapshot[] {
  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { data?: unknown } | null)?.data)
      ? ((payload as { data: unknown[] }).data ?? [])
      : [];

  return rows.flatMap((row) => {
    const symbol = String((row as { symbol?: unknown } | null)?.symbol ?? "").trim();
    const markPrice = toNumber((row as { mark_price?: unknown } | null)?.mark_price);
    const indexPrice = toNumber((row as { oracle_price?: unknown } | null)?.oracle_price);
    const lastPrice = toNumber((row as { last_price?: unknown } | null)?.last_price);
    const volume24h = toNumber((row as { volume_24h?: unknown } | null)?.volume_24h);
    const openInterest = toNumber(
      (row as { open_interest?: unknown } | null)?.open_interest,
    );
    const fundingRate = toNumber((row as { funding_rate?: unknown } | null)?.funding_rate);
    const capturedAt = new Date().toISOString();

    if (!symbol || markPrice === null) {
      return [];
    }

    return [
      {
        symbol,
        markPrice,
        indexPrice,
        lastPrice,
        volume24h,
        openInterest,
        fundingRate,
        capturedAt,
      },
    ];
  });
}

function normalizeCandles(
  payload: unknown,
  symbol: string,
  interval: MarketCandleInterval,
): MarketCandle[] {
  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { data?: unknown } | null)?.data)
      ? ((payload as { data: unknown[] }).data ?? [])
      : [];

  return rows.flatMap((row) => {
    if (Array.isArray(row)) {
      const [
        openTime,
        open,
        high,
        low,
        close,
        volume,
        closeTime,
      ] = row;

      const normalizedOpenTime = toNumber(openTime);
      const normalizedCloseTime = toNumber(closeTime);
      const normalizedOpen = toNumber(open);
      const normalizedHigh = toNumber(high);
      const normalizedLow = toNumber(low);
      const normalizedClose = toNumber(close);
      const normalizedVolume = toNumber(volume);

      if (
        normalizedOpenTime === null ||
        normalizedCloseTime === null ||
        normalizedOpen === null ||
        normalizedHigh === null ||
        normalizedLow === null ||
        normalizedClose === null ||
        normalizedVolume === null
      ) {
        return [];
      }

      return [
        {
          symbol,
          interval,
          openTime: normalizedOpenTime,
          closeTime: normalizedCloseTime,
          open: normalizedOpen,
          high: normalizedHigh,
          low: normalizedLow,
          close: normalizedClose,
          volume: normalizedVolume,
        },
      ];
    }

    const normalizedOpenTime = toNumber((row as { t?: unknown } | null)?.t);
    const normalizedCloseTime = toNumber((row as { T?: unknown } | null)?.T);
    const normalizedOpen = toNumber((row as { o?: unknown } | null)?.o);
    const normalizedHigh = toNumber((row as { h?: unknown } | null)?.h);
    const normalizedLow = toNumber((row as { l?: unknown } | null)?.l);
    const normalizedClose = toNumber((row as { c?: unknown } | null)?.c);
    const normalizedVolume = toNumber((row as { v?: unknown } | null)?.v);

    if (
      normalizedOpenTime === null ||
      normalizedCloseTime === null ||
      normalizedOpen === null ||
      normalizedHigh === null ||
      normalizedLow === null ||
      normalizedClose === null ||
      normalizedVolume === null
    ) {
      return [];
    }

    return [
      {
        symbol,
        interval,
        openTime: normalizedOpenTime,
        closeTime: normalizedCloseTime,
        open: normalizedOpen,
        high: normalizedHigh,
        low: normalizedLow,
        close: normalizedClose,
        volume: normalizedVolume,
      },
    ];
  });
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : null;
}
