import {
  marketInfoResponseSchema,
  type MarketInfoResponse,
} from "@pacifica/contracts";

export type GetMarketInfoHandler = () => Promise<MarketInfoResponse>;

export function createGetMarketInfoRoute(handler: GetMarketInfoHandler) {
  return async function handleGetMarketInfo(): Promise<MarketInfoResponse> {
    const result = await handler();
    return marketInfoResponseSchema.parse(result);
  };
}
