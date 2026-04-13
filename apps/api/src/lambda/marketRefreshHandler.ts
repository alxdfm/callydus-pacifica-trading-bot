import { getApiRuntime } from "../bootstrap/createApiRuntime";
import { normalizeCandleRequestConfig } from "../infrastructure/market-data/startLocalMarketDataRefreshScheduler";

const CANDLE_SYMBOLS = ["BTC-PERP", "ETH-PERP", "SOL-PERP"] as const;
const CANDLE_INTERVALS = ["5m", "15m", "1h"] as const;

// Initialise once per cold start
const { api } = getApiRuntime();

export async function handler(): Promise<void> {
  const refresher = api.services.marketDataRefresher;
  const referenceTime = new Date();

  const candleRequests = CANDLE_SYMBOLS.flatMap((symbol) =>
    CANDLE_INTERVALS.map((interval) =>
      normalizeCandleRequestConfig({ symbol, interval, priceSource: "market" }, referenceTime),
    ),
  );

  await Promise.all([
    refresher.refreshPrices(),
    refresher.refreshMarketInfo(),
    refresher.refreshCandles({ requests: candleRequests }),
  ]);
}
