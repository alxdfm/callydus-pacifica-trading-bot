import { getApiRuntime } from "../bootstrap/createApiRuntime";
import { normalizeCandleRequestConfig } from "../infrastructure/market-data/startLocalMarketDataRefreshScheduler";

const CANDLE_SYMBOLS = ["BTC-PERP", "ETH-PERP", "SOL-PERP"] as const;
const CANDLE_INTERVALS = ["5m", "15m", "1h"] as const;

// Initialise once per cold start
const { api } = getApiRuntime();

function sanitizeForLog(value: string): string {
  return value.replace(/[1-9A-HJ-NP-Za-km-z]{64,}/g, "[REDACTED]");
}

export async function handler(): Promise<void> {
  const refresher = api.services.marketDataRefresher;
  const referenceTime = new Date();

  const candleRequests = CANDLE_SYMBOLS.flatMap((symbol) =>
    CANDLE_INTERVALS.map((interval) =>
      normalizeCandleRequestConfig({ symbol, interval, priceSource: "market" }, referenceTime),
    ),
  );

  try {
    await Promise.all([
      refresher.refreshPrices(),
      refresher.refreshMarketInfo(),
      refresher.refreshCandles({ requests: candleRequests }),
    ]);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error(
      JSON.stringify({
        event: "market_refresh.error",
        error: sanitizeForLog(message),
        stack: stack ? sanitizeForLog(stack) : undefined,
      }),
    );
    throw err;
  }
}
