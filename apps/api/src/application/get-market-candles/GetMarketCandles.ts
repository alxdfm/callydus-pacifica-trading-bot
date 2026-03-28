import type {
  MarketCandleRequest,
  MarketCandleResponse,
} from "@pacifica/contracts";
import { PacificaApiError } from "../../infrastructure/pacifica/PacificaClient";
import type { MarketDataPort } from "../../domain/market-data/MarketDataPort";

export type GetMarketCandlesDependencies = {
  marketData: MarketDataPort;
};

export function createGetMarketCandles(
  dependencies: GetMarketCandlesDependencies,
) {
  return async function getMarketCandles(
    input: MarketCandleRequest,
  ): Promise<MarketCandleResponse> {
    try {
      const candles = await dependencies.marketData.getCandles(input);

      return {
        status: "success",
        symbol: input.symbol,
        interval: input.interval,
        priceSource: input.priceSource,
        candles,
      };
    } catch (error) {
      if (error instanceof PacificaApiError) {
        return {
          status: "error",
          code: error.details.retryable ? "provider_unavailable" : "internal_error",
          message: extractPacificaErrorMessage(error.details.body, error.message),
          retryable: error.details.retryable,
        };
      }

      return {
        status: "error",
        code: "internal_error",
        message: "Market candles are temporarily unavailable.",
        retryable: false,
      };
    }
  };
}

function extractPacificaErrorMessage(body: unknown, fallback: string): string {
  const apiMessage = (body as { error?: unknown } | null)?.error;

  if (typeof apiMessage === "string" && apiMessage.trim()) {
    return apiMessage;
  }

  const rawMessage = (body as { raw?: unknown } | null)?.raw;

  if (typeof rawMessage === "string" && rawMessage.trim()) {
    return rawMessage;
  }

  return fallback;
}
