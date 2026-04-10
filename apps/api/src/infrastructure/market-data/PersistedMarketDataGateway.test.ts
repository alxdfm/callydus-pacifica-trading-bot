import { describe, expect, it, vi } from "vitest";
import { PersistedMarketDataGateway } from "./PersistedMarketDataGateway";

describe("PersistedMarketDataGateway", () => {
  it("returns persisted prices without refreshing when snapshots already exist", async () => {
    const repository = {
      findCurrentPrices: vi.fn().mockResolvedValue([
        {
          symbol: "BTC-PERP",
          markPrice: 100,
          indexPrice: 99,
          lastPrice: 101,
          volume24h: null,
          openInterest: null,
          fundingRate: null,
          capturedAt: "2026-04-07T12:00:00.000Z",
          fetchedAt: "2026-04-07T12:01:00.000Z",
          snapshotStatus: "confirmed",
          source: "test",
        },
      ]),
    };
    const refresher = {
      refreshPrices: vi.fn(),
      refreshCandles: vi.fn(),
      refreshMarketInfo: vi.fn(),
    };

    const gateway = new PersistedMarketDataGateway({
      repository: repository as never,
      refresher,
      now: () => new Date("2026-04-07T12:02:00.000Z"),
    });

    await expect(gateway.getPrices()).resolves.toEqual([
      {
        symbol: "BTC-PERP",
        markPrice: 100,
        indexPrice: 99,
        lastPrice: 101,
        volume24h: null,
        openInterest: null,
        fundingRate: null,
        capturedAt: "2026-04-07T12:00:00.000Z",
      },
    ]);
    expect(refresher.refreshPrices).not.toHaveBeenCalled();
  });

  it("refreshes candles on miss and returns filtered snapshots", async () => {
    const repository = {
      listCandlesInRange: vi
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          {
            symbol: "BTC-PERP",
            interval: "3m",
            openTime: new Date("2026-04-07T12:00:00.000Z").getTime(),
            closeTime: new Date("2026-04-07T12:03:00.000Z").getTime(),
            open: 100,
            high: 101,
            low: 99,
            close: 100.5,
            volume: 10,
            fetchedAt: "2026-04-07T12:03:10.000Z",
            snapshotStatus: "confirmed",
            source: "test",
          },
        ]),
    };
    const refresher = {
      refreshPrices: vi.fn(),
      refreshCandles: vi.fn().mockResolvedValue({}),
      refreshMarketInfo: vi.fn(),
    };

    const gateway = new PersistedMarketDataGateway({
      repository: repository as never,
      refresher,
    });

    await expect(
      gateway.getCandles({
        symbol: "BTC-PERP",
        interval: "3m",
        priceSource: "market",
        startTime: new Date("2026-04-07T12:00:00.000Z").getTime(),
        limit: 1,
      }),
    ).resolves.toEqual([
      {
        symbol: "BTC-PERP",
        interval: "3m",
        openTime: new Date("2026-04-07T12:00:00.000Z").getTime(),
        closeTime: new Date("2026-04-07T12:03:00.000Z").getTime(),
        open: 100,
        high: 101,
        low: 99,
        close: 100.5,
        volume: 10,
      },
    ]);

    expect(refresher.refreshCandles).toHaveBeenCalledTimes(1);
  });

  it("serves historical candles from cache without forcing refresh by stale fetchedAt", async () => {
    const repository = {
      listCandlesInRange: vi.fn().mockResolvedValue([
        {
          symbol: "BTC-PERP",
          interval: "3m",
          openTime: new Date("2026-04-01T12:00:00.000Z").getTime(),
          closeTime: new Date("2026-04-01T12:03:00.000Z").getTime(),
          open: 100,
          high: 101,
          low: 99,
          close: 100.5,
          volume: 10,
          fetchedAt: "2026-04-01T12:03:10.000Z",
          snapshotStatus: "confirmed",
          source: "test",
        },
      ]),
    };
    const refresher = {
      refreshPrices: vi.fn(),
      refreshCandles: vi.fn(),
      refreshMarketInfo: vi.fn(),
    };

    const gateway = new PersistedMarketDataGateway({
      repository: repository as never,
      refresher,
      now: () => new Date("2026-04-10T12:00:00.000Z"),
    });

    await expect(
      gateway.getCandles({
        symbol: "BTC-PERP",
        interval: "3m",
        priceSource: "market",
        startTime: new Date("2026-04-01T12:00:00.000Z").getTime(),
        endTime: new Date("2026-04-01T12:03:00.000Z").getTime(),
      }),
    ).resolves.toHaveLength(1);

    expect(refresher.refreshCandles).not.toHaveBeenCalled();
  });

  it("refreshes and returns persisted market info", async () => {
    const repository = {
      listCurrentMarketInfos: vi
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          {
            symbol: "BTC-PERP",
            tickSize: 1,
            lotSize: 0.00001,
            minOrderSize: 10,
            maxOrderSize: null,
            maxLeverage: 50,
            fetchedAt: "2026-04-07T12:05:00.000Z",
            snapshotStatus: "confirmed",
            source: "test",
          },
        ]),
    };
    const refresher = {
      refreshPrices: vi.fn(),
      refreshCandles: vi.fn(),
      refreshMarketInfo: vi.fn().mockResolvedValue({}),
    };

    const gateway = new PersistedMarketDataGateway({
      repository: repository as never,
      refresher,
    });

    await expect(gateway.listMarketInfo()).resolves.toEqual([
      {
        symbol: "BTC-PERP",
        tickSize: "1",
        lotSize: "0.00001",
        minOrderSize: "10",
        maxLeverage: 50,
      },
    ]);
    expect(refresher.refreshMarketInfo).toHaveBeenCalledTimes(1);
  });
});
