import { describe, expect, it, vi } from "vitest";
import { createMarketDataRefresher } from "./RefreshMarketData";

describe("createMarketDataRefresher", () => {
  it("persist prices and completes the refresh log", async () => {
    const repository = {
      createRefreshLog: vi.fn().mockResolvedValue({ id: "log-1" }),
      upsertCurrentPrices: vi.fn().mockResolvedValue(undefined),
      completeRefreshLog: vi.fn().mockResolvedValue(undefined),
    };
    const marketData = {
      getPrices: vi.fn().mockResolvedValue([
        {
          symbol: "BTC-PERP",
          markPrice: 100,
          indexPrice: 99,
          lastPrice: 101,
          volume24h: 5000,
          openInterest: 300,
          fundingRate: 0.001,
          capturedAt: "2026-04-07T12:00:00.000Z",
        },
      ]),
      getCandles: vi.fn(),
    };
    const marketInfo = {
      listMarketInfo: vi.fn(),
    };

    const refresher = createMarketDataRefresher({
      repository: repository as never,
      marketData,
      marketInfo,
      now: () => new Date("2026-04-07T12:01:00.000Z"),
      source: "test-refresher",
    });

    await expect(refresher.refreshPrices()).resolves.toEqual({
      refreshLogId: "log-1",
      refreshedCount: 1,
      fetchedAtIso: "2026-04-07T12:01:00.000Z",
    });

    expect(repository.upsertCurrentPrices).toHaveBeenCalledWith({
      snapshots: [
        expect.objectContaining({
          symbol: "BTC-PERP",
          snapshotStatus: "confirmed",
          source: "test-refresher",
        }),
      ],
    });
    expect(repository.completeRefreshLog).toHaveBeenCalledWith({
      refreshLogId: "log-1",
      finishedAtIso: "2026-04-07T12:01:00.000Z",
      status: "completed",
      errorMessage: null,
      recordsWritten: 1,
    });
  });

  it("persists candles and logs refreshed count", async () => {
    const repository = {
      createRefreshLog: vi.fn().mockResolvedValue({ id: "log-2" }),
      insertCandles: vi.fn().mockResolvedValue({
        insertedCount: 1,
        updatedCount: 1,
        refreshedCount: 2,
      }),
      completeRefreshLog: vi.fn().mockResolvedValue(undefined),
    };
    const marketData = {
      getPrices: vi.fn(),
      getCandles: vi.fn().mockResolvedValue([
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
        {
          symbol: "BTC-PERP",
          interval: "3m",
          openTime: new Date("2026-04-07T12:03:00.000Z").getTime(),
          closeTime: new Date("2026-04-07T12:06:00.000Z").getTime(),
          open: 100.5,
          high: 102,
          low: 100,
          close: 101.5,
          volume: 12,
        },
      ]),
    };
    const marketInfo = {
      listMarketInfo: vi.fn(),
    };

    const refresher = createMarketDataRefresher({
      repository: repository as never,
      marketData,
      marketInfo,
      now: () => new Date("2026-04-07T12:06:30.000Z"),
    });

    await expect(
      refresher.refreshCandles({
        requests: [
          {
            symbol: "BTC-PERP",
            interval: "3m",
            priceSource: "market",
            startTime: new Date("2026-04-07T12:00:00.000Z").getTime(),
          },
        ],
      }),
    ).resolves.toEqual({
      refreshLogId: "log-2",
      insertedCount: 1,
      updatedCount: 1,
      refreshedCount: 2,
      fetchedAtIso: "2026-04-07T12:06:30.000Z",
    });

    expect(repository.insertCandles).toHaveBeenCalledWith({
      candles: expect.arrayContaining([
        expect.objectContaining({
          symbol: "BTC-PERP",
          interval: "3m",
          priceSource: "market",
          snapshotStatus: "confirmed",
        }),
      ]),
    });
    expect(repository.completeRefreshLog).toHaveBeenCalledWith({
      refreshLogId: "log-2",
      finishedAtIso: "2026-04-07T12:06:30.000Z",
      status: "completed",
      errorMessage: null,
      recordsWritten: 2,
    });
  });

  it("logs refresh failures without overwriting current snapshots", async () => {
    const repository = {
      createRefreshLog: vi.fn().mockResolvedValue({ id: "log-3" }),
      upsertCurrentMarketInfos: vi.fn(),
      completeRefreshLog: vi.fn().mockResolvedValue(undefined),
    };
    const marketData = {
      getPrices: vi.fn(),
      getCandles: vi.fn(),
    };
    const marketInfo = {
      listMarketInfo: vi.fn().mockRejectedValue(new Error("Rate limit exceeded")),
    };

    const refresher = createMarketDataRefresher({
      repository: repository as never,
      marketData,
      marketInfo,
      now: () => new Date("2026-04-07T12:10:00.000Z"),
    });

    await expect(refresher.refreshMarketInfo()).rejects.toThrow(
      "Rate limit exceeded",
    );

    expect(repository.upsertCurrentMarketInfos).not.toHaveBeenCalled();
    expect(repository.completeRefreshLog).toHaveBeenCalledWith({
      refreshLogId: "log-3",
      finishedAtIso: "2026-04-07T12:10:00.000Z",
      status: "failed",
      errorMessage: "Rate limit exceeded",
      recordsWritten: 0,
    });
  });
});
