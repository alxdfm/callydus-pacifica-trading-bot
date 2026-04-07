import {
  marketInfoResponseSchema,
  type MarketInfoResponse,
} from "@pacifica/contracts";
import { parseJsonResponse } from "../onboarding/backend-response";

const apiBaseUrl =
  import.meta.env.VITE_APP_API_BASE_URL?.trim() || "http://localhost:3000";

export async function getMarketInfoViaBackend(): Promise<MarketInfoResponse> {
  try {
    const response = await fetch(`${apiBaseUrl}/api/market/info`);
    return marketInfoResponseSchema.parse(await parseJsonResponse(response));
  } catch {
    return marketInfoResponseSchema.parse({
      status: "error",
      code: "internal_error",
      message: "Market configuration is temporarily unavailable.",
      retryable: true,
    });
  }
}
