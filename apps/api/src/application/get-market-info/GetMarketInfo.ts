import type { MarketInfoResponse } from "@pacifica/contracts";
import { PacificaApiError } from "../../infrastructure/pacifica/PacificaClient";

export type GetMarketInfoDependencies = {
  marketInfo: {
    listMarketInfo(): Promise<
      Array<{
        symbol: string;
        tickSize: string;
        lotSize: string;
        minOrderSize: string;
        maxLeverage: number;
      }>
    >;
  };
};

export function createGetMarketInfo(dependencies: GetMarketInfoDependencies) {
  return async function getMarketInfo(): Promise<MarketInfoResponse> {
    try {
      return {
        status: "success",
        markets: await dependencies.marketInfo.listMarketInfo(),
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
        message: "Market configuration is temporarily unavailable.",
        retryable: false,
      };
    }
  };
}

function extractPacificaErrorMessage(body: unknown, fallback: string) {
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
