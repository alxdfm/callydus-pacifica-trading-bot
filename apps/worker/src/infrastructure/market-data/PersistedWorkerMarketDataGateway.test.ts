import { describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";
import { PersistedWorkerMarketDataGateway } from "./PersistedWorkerMarketDataGateway";

describe("PersistedWorkerMarketDataGateway", () => {
  it("uses persisted candles when enough cached data exists", async () => {
    const fallback = {
      getCandles: vi.fn(),
    };
    const prisma = {
      marketCandleSnapshot: {
        findMany: vi.fn().mockResolvedValue([
          {
            symbol: "BTC-PERP",
            interval: "3m",
            fetchedAt: new Date("2026-04-07T12:03:10.000Z"),
            openTime: new Date("2026-04-07T12:00:00.000Z"),
            closeTime: new Date("2026-04-07T12:03:00.000Z"),
            open: new Prisma.Decimal("100"),
            high: new Prisma.Decimal("101"),
            low: new Prisma.Decimal("99"),
            close: new Prisma.Decimal("100.5"),
            volume: new Prisma.Decimal("10"),
          },
          {
            symbol: "BTC-PERP",
            interval: "3m",
            fetchedAt: new Date("2026-04-07T12:06:10.000Z"),
            openTime: new Date("2026-04-07T12:03:00.000Z"),
            closeTime: new Date("2026-04-07T12:06:00.000Z"),
            open: new Prisma.Decimal("100.5"),
            high: new Prisma.Decimal("102"),
            low: new Prisma.Decimal("100"),
            close: new Prisma.Decimal("101.5"),
            volume: new Prisma.Decimal("12"),
          },
        ]),
      },
    } as never;

    const gateway = new PersistedWorkerMarketDataGateway(
      prisma,
      fallback,
      undefined,
      () => new Date("2026-04-07T12:06:30.000Z"),
    );

    await expect(
      gateway.getCandles({
        symbol: "BTC-PERP",
        interval: "3m",
        priceSource: "market",
        startTime: new Date("2026-04-07T12:00:00.000Z").getTime(),
        limit: 2,
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
    ]);

    expect(fallback.getCandles).not.toHaveBeenCalled();
  });

  it("falls back to Pacifica and fills cache when persisted data is missing", async () => {
    const fallbackCandles = [
      {
        symbol: "BTC-PERP",
        interval: "3m" as const,
        openTime: new Date("2026-04-07T12:00:00.000Z").getTime(),
        closeTime: new Date("2026-04-07T12:03:00.000Z").getTime(),
        open: 100,
        high: 101,
        low: 99,
        close: 100.5,
        volume: 10,
      },
    ];
    const fallback = {
      getCandles: vi.fn().mockResolvedValue(fallbackCandles),
    };
    const upsert = vi.fn().mockResolvedValue(undefined);
    const transaction = vi.fn().mockImplementation(async (operations) => {
      await Promise.all(operations);
    });
    const prisma = {
      marketCandleSnapshot: {
        findMany: vi.fn().mockResolvedValue([]),
        upsert,
      },
      $transaction: transaction,
    } as never;

    const gateway = new PersistedWorkerMarketDataGateway(prisma, fallback, {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    });

    await expect(
      gateway.getCandles({
        symbol: "BTC-PERP",
        interval: "3m",
        priceSource: "market",
        startTime: new Date("2026-04-07T12:00:00.000Z").getTime(),
        limit: 1,
      }),
    ).resolves.toEqual(fallbackCandles);

    expect(fallback.getCandles).toHaveBeenCalledTimes(1);
    expect(upsert).toHaveBeenCalledTimes(1);
    expect(transaction).toHaveBeenCalledTimes(1);
  });
});
