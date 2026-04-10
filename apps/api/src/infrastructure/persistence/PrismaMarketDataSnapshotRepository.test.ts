import { describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";
import { PrismaMarketDataSnapshotRepository } from "./PrismaMarketDataSnapshotRepository";

describe("PrismaMarketDataSnapshotRepository", () => {
  it("mapeia prices atuais do Prisma para o contrato do dominio", async () => {
    const prisma = {
      marketPriceCurrent: {
        findMany: vi.fn().mockResolvedValue([
          {
            symbol: "BTC-PERP",
            markPrice: new Prisma.Decimal("100"),
            indexPrice: new Prisma.Decimal("99"),
            lastPrice: new Prisma.Decimal("101"),
            volume24h: new Prisma.Decimal("5000"),
            openInterest: new Prisma.Decimal("300"),
            fundingRate: new Prisma.Decimal("0.0001"),
            capturedAt: new Date("2026-04-07T12:00:00.000Z"),
            fetchedAt: new Date("2026-04-07T12:01:00.000Z"),
            snapshotStatus: "confirmed",
            source: "pacifica-lambda",
          },
        ]),
      },
    } as never;

    const repository = new PrismaMarketDataSnapshotRepository(prisma);

    await expect(repository.findCurrentPrices()).resolves.toEqual([
      {
        symbol: "BTC-PERP",
        markPrice: 100,
        indexPrice: 99,
        lastPrice: 101,
        volume24h: 5000,
        openInterest: 300,
        fundingRate: 0.0001,
        capturedAt: "2026-04-07T12:00:00.000Z",
        fetchedAt: "2026-04-07T12:01:00.000Z",
        snapshotStatus: "confirmed",
        source: "pacifica-lambda",
      },
    ]);
  });

  it("retorna candles em ordem cronologica crescente", async () => {
    const prisma = {
      marketCandleSnapshot: {
        findMany: vi.fn().mockResolvedValue([
          {
            symbol: "BTC-PERP",
            interval: "3m",
            priceSource: "market",
            openTime: new Date("2026-04-07T12:03:00.000Z"),
            closeTime: new Date("2026-04-07T12:06:00.000Z"),
            open: new Prisma.Decimal("101"),
            high: new Prisma.Decimal("102"),
            low: new Prisma.Decimal("100"),
            close: new Prisma.Decimal("101.5"),
            volume: new Prisma.Decimal("12"),
            fetchedAt: new Date("2026-04-07T12:06:05.000Z"),
            snapshotStatus: "confirmed",
            source: "pacifica-lambda",
          },
          {
            symbol: "BTC-PERP",
            interval: "3m",
            priceSource: "market",
            openTime: new Date("2026-04-07T12:00:00.000Z"),
            closeTime: new Date("2026-04-07T12:03:00.000Z"),
            open: new Prisma.Decimal("100"),
            high: new Prisma.Decimal("101"),
            low: new Prisma.Decimal("99"),
            close: new Prisma.Decimal("100.5"),
            volume: new Prisma.Decimal("10"),
            fetchedAt: new Date("2026-04-07T12:03:05.000Z"),
            snapshotStatus: "confirmed",
            source: "pacifica-lambda",
          },
        ]),
      },
    } as never;

    const repository = new PrismaMarketDataSnapshotRepository(prisma);

    await expect(
      repository.listRecentCandles({
        symbol: "BTC-PERP",
        interval: "3m",
        priceSource: "market",
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
        fetchedAt: "2026-04-07T12:03:05.000Z",
        snapshotStatus: "confirmed",
        source: "pacifica-lambda",
      },
      {
        symbol: "BTC-PERP",
        interval: "3m",
        openTime: new Date("2026-04-07T12:03:00.000Z").getTime(),
        closeTime: new Date("2026-04-07T12:06:00.000Z").getTime(),
        open: 101,
        high: 102,
        low: 100,
        close: 101.5,
        volume: 12,
        fetchedAt: "2026-04-07T12:06:05.000Z",
        snapshotStatus: "confirmed",
        source: "pacifica-lambda",
      },
    ]);
  });

  it("faz upsert dos candles e renova o fetchedAt dos existentes", async () => {
    const upsert = vi.fn().mockResolvedValue(undefined);
    const transaction = vi.fn().mockImplementation(async (operations) => {
      await Promise.all(operations);
    });
    const prisma = {
      marketCandleSnapshot: {
        findMany: vi.fn().mockResolvedValue([
          {
            symbol: "BTC-PERP",
            interval: "3m",
            priceSource: "market",
            openTime: new Date("2026-04-07T12:00:00.000Z"),
          },
        ]),
        upsert,
      },
      $transaction: transaction,
    } as never;

    const repository = new PrismaMarketDataSnapshotRepository(prisma);

    await expect(
      repository.insertCandles({
        candles: [
          {
            symbol: "BTC-PERP",
            interval: "3m",
            priceSource: "market",
            openTime: new Date("2026-04-07T12:00:00.000Z").getTime(),
            closeTime: new Date("2026-04-07T12:03:00.000Z").getTime(),
            open: 100,
            high: 101,
            low: 99,
            close: 100.5,
            volume: 10,
            fetchedAtIso: "2026-04-07T12:03:05.000Z",
            snapshotStatus: "confirmed",
            source: "pacifica-lambda",
          },
        ],
      }),
    ).resolves.toEqual({
      insertedCount: 0,
      updatedCount: 1,
      refreshedCount: 1,
    });

    expect(upsert).toHaveBeenCalledTimes(1);
    expect(transaction).toHaveBeenCalledTimes(1);
  });

  it("consulta candles por janela historica em vez de limitar aos mais recentes", async () => {
    const findMany = vi.fn().mockResolvedValue([
      {
        symbol: "BTC-PERP",
        interval: "3m",
        priceSource: "market",
        openTime: new Date("2026-04-07T10:00:00.000Z"),
        closeTime: new Date("2026-04-07T10:03:00.000Z"),
        open: new Prisma.Decimal("100"),
        high: new Prisma.Decimal("101"),
        low: new Prisma.Decimal("99"),
        close: new Prisma.Decimal("100.5"),
        volume: new Prisma.Decimal("10"),
        fetchedAt: new Date("2026-04-07T10:03:05.000Z"),
        snapshotStatus: "confirmed",
        source: "pacifica-lambda",
      },
    ]);
    const prisma = {
      marketCandleSnapshot: {
        findMany,
      },
    } as never;

    const repository = new PrismaMarketDataSnapshotRepository(prisma);

    await expect(
      repository.listCandlesInRange({
        symbol: "BTC-PERP",
        interval: "3m",
        priceSource: "market",
        startTime: new Date("2026-04-07T10:00:00.000Z").getTime(),
        endTime: new Date("2026-04-07T10:03:00.000Z").getTime(),
      }),
    ).resolves.toHaveLength(1);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          openTime: {
            gte: new Date("2026-04-07T10:00:00.000Z"),
          },
          closeTime: {
            lte: new Date("2026-04-07T10:03:00.000Z"),
          },
        }),
        orderBy: {
          openTime: "asc",
        },
      }),
    );
  });
});
