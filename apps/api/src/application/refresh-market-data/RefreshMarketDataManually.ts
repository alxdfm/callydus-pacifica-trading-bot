import type { MarketCandleRequest } from "@pacifica/contracts";
import type {
  RefreshCandlesResult,
  RefreshMarketInfoResult,
  RefreshPricesResult,
} from "./RefreshMarketData";

export type RefreshMarketDataManuallyInput = {
  refreshPrices?: boolean;
  refreshMarketInfo?: boolean;
  candleRequests?: MarketCandleRequest[];
};

export type RefreshMarketDataManuallyOutput = {
  status: "success";
  prices: RefreshPricesResult | null;
  marketInfo: RefreshMarketInfoResult | null;
  candles: RefreshCandlesResult | null;
};

export type RefreshMarketDataManuallyDependencies = {
  refresher: {
    refreshPrices(): Promise<RefreshPricesResult>;
    refreshCandles(input: {
      requests: MarketCandleRequest[];
    }): Promise<RefreshCandlesResult>;
    refreshMarketInfo(): Promise<RefreshMarketInfoResult>;
  };
};

export function createRefreshMarketDataManually(
  dependencies: RefreshMarketDataManuallyDependencies,
) {
  return async function refreshMarketDataManually(
    input: RefreshMarketDataManuallyInput = {},
  ): Promise<RefreshMarketDataManuallyOutput> {
    const shouldRefreshPrices = input.refreshPrices ?? true;
    const shouldRefreshMarketInfo = input.refreshMarketInfo ?? true;
    const candleRequests = input.candleRequests ?? [];

    const prices = shouldRefreshPrices
      ? await dependencies.refresher.refreshPrices()
      : null;
    const marketInfo = shouldRefreshMarketInfo
      ? await dependencies.refresher.refreshMarketInfo()
      : null;
    const candles =
      candleRequests.length > 0
        ? await dependencies.refresher.refreshCandles({
            requests: candleRequests,
          })
        : null;

    return {
      status: "success",
      prices,
      marketInfo,
      candles,
    };
  };
}
