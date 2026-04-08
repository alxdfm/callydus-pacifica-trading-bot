import type { MarketCandleRequest } from "@pacifica/contracts";

type RefreshMarketDataHttpRequest = {
  body?: {
    refreshPrices?: boolean;
    refreshMarketInfo?: boolean;
    candleRequests?: MarketCandleRequest[];
  };
};

export type RefreshMarketDataHandler = (input: {
  refreshPrices?: boolean;
  refreshMarketInfo?: boolean;
  candleRequests?: MarketCandleRequest[];
}) => Promise<{
  status: "success";
  prices: unknown;
  marketInfo: unknown;
  candles: unknown;
}>;

export function createRefreshMarketDataRoute(
  handler: RefreshMarketDataHandler,
) {
  return async function handleRefreshMarketData(
    request: RefreshMarketDataHttpRequest,
  ) {
    return handler({
      ...(request.body?.refreshPrices !== undefined
        ? { refreshPrices: request.body.refreshPrices }
        : {}),
      ...(request.body?.refreshMarketInfo !== undefined
        ? { refreshMarketInfo: request.body.refreshMarketInfo }
        : {}),
      ...(request.body?.candleRequests !== undefined
        ? { candleRequests: request.body.candleRequests }
        : {}),
    });
  };
}
