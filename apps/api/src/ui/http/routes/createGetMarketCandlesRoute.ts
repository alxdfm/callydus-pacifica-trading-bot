import {
  marketCandleRequestSchema,
  marketCandleResponseSchema,
  type MarketCandleRequest,
  type MarketCandleResponse,
} from "@pacifica/contracts";

type GetMarketCandlesHttpRequest = {
  body: MarketCandleRequest;
};

export type GetMarketCandlesHandler = (
  input: MarketCandleRequest,
) => Promise<MarketCandleResponse>;

export function createGetMarketCandlesRoute(
  handler: GetMarketCandlesHandler,
) {
  return async function handleGetMarketCandles(
    request: GetMarketCandlesHttpRequest,
  ): Promise<MarketCandleResponse> {
    const body = marketCandleRequestSchema.parse(request.body);
    const result = await handler(body);
    return marketCandleResponseSchema.parse(result);
  };
}
