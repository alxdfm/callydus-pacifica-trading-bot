import {
  marketPricesResponseSchema,
  type MarketPricesResponse,
} from "@pacifica/contracts";

export type GetMarketPricesHandler = () => Promise<MarketPricesResponse>;

export function createGetMarketPricesRoute(handler: GetMarketPricesHandler) {
  return async function handleGetMarketPrices(): Promise<MarketPricesResponse> {
    const result = await handler();
    return marketPricesResponseSchema.parse(result);
  };
}
