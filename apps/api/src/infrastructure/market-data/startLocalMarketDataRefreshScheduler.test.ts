import { describe, expect, it, vi } from "vitest";
import {
  normalizeCandleRequestConfig,
  readLocalMarketDataRefreshSchedulerConfigFromEnv,
  startLocalMarketDataRefreshScheduler,
} from "./startLocalMarketDataRefreshScheduler";

describe("startLocalMarketDataRefreshScheduler", () => {
  it("normalizes candle request config using current time when startTime is omitted", () => {
    const referenceTime = new Date("2026-04-07T12:02:30.000Z");

    expect(
      normalizeCandleRequestConfig(
        {
          symbol: "BTC-PERP",
          interval: "3m",
          limit: 10,
        },
        referenceTime,
      ),
    ).toEqual({
      symbol: "BTC-PERP",
      interval: "3m",
      priceSource: "market",
      startTime: new Date("2026-04-07T11:30:00.000Z").getTime(),
      endTime: new Date("2026-04-07T12:00:00.000Z").getTime(),
      limit: 10,
    });
  });

  it("reads scheduler config from env", () => {
    expect(
      readLocalMarketDataRefreshSchedulerConfigFromEnv({
        LOCAL_MARKET_DATA_REFRESH_ENABLED: "true",
        LOCAL_MARKET_DATA_REFRESH_INTERVAL_MS: "60000",
        LOCAL_MARKET_DATA_REFRESH_RUN_ON_START: "true",
        LOCAL_MARKET_DATA_REFRESH_PRICES: "true",
        LOCAL_MARKET_DATA_REFRESH_MARKET_INFO: "false",
      }),
    ).toEqual({
      enabled: true,
      intervalMs: 60_000,
      runOnStart: true,
      refreshPrices: true,
      refreshMarketInfo: false,
    });
  });

  it("runs immediately on startup when enabled", async () => {
    const refreshMarketData = vi.fn().mockResolvedValue(undefined);

    startLocalMarketDataRefreshScheduler({
      config: {
        enabled: true,
        intervalMs: 60_000,
        runOnStart: true,
        refreshPrices: true,
        refreshMarketInfo: true,
      },
      refreshMarketData,
      now: () => new Date("2026-04-07T12:00:00.000Z"),
      logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
    });

    await Promise.resolve();

    expect(refreshMarketData).toHaveBeenCalledWith({
      refreshPrices: true,
      refreshMarketInfo: true,
    });
  });

  it("resolves candle requests dynamically from active presets", async () => {
    const refreshMarketData = vi.fn().mockResolvedValue(undefined);
    const resolveCandleRequests = vi.fn().mockResolvedValue([
      {
        symbol: "SOL-PERP",
        interval: "5m",
        priceSource: "market",
        limit: 120,
      },
    ]);

    startLocalMarketDataRefreshScheduler({
      config: {
        enabled: true,
        intervalMs: 60_000,
        runOnStart: true,
        refreshPrices: true,
        refreshMarketInfo: true,
      },
      refreshMarketData,
      resolveCandleRequests,
      now: () => new Date("2026-04-07T12:00:00.000Z"),
      logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
    });

    await vi.waitFor(() => {
      expect(resolveCandleRequests).toHaveBeenCalledTimes(1);
      expect(refreshMarketData).toHaveBeenCalledWith({
        refreshPrices: true,
        refreshMarketInfo: true,
        candleRequests: [
          {
            symbol: "SOL-PERP",
            interval: "5m",
            priceSource: "market",
            startTime:
              new Date("2026-04-07T12:00:00.000Z").getTime() - 120 * 300_000,
            endTime: new Date("2026-04-07T12:00:00.000Z").getTime(),
            limit: 120,
          },
        ],
      });
    });
  });
});
