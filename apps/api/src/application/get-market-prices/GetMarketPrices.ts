import type { MarketPricesResponse } from "@pacifica/contracts";
import { PacificaApiError } from "../../infrastructure/pacifica/PacificaClient";
import type { MarketDataPort } from "../../domain/market-data/MarketDataPort";

export type GetMarketPricesDependencies = {
  marketData: MarketDataPort;
};

/**
 * Creates the market-prices read use case.
 *
 * Responsibility:
 * - fetch normalized market prices from the market data port
 * - translate provider failures into product-facing errors
 */
export function createGetMarketPrices(
  dependencies: GetMarketPricesDependencies,
) {
  /**
   * Returns the current normalized price snapshot set.
   */
  return async function getMarketPrices(): Promise<MarketPricesResponse> {
    try {
      const prices = await dependencies.marketData.getPrices();

      return {
        status: "success",
        prices,
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
        message: "Market prices are temporarily unavailable.",
        retryable: false,
      };
    }
  };
}

/**
 * Extracts the most useful error message from Pacifica responses while keeping
 * a stable fallback for unknown payloads.
 */
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
