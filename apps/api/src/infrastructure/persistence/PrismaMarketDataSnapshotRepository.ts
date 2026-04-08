import { Prisma, PrismaClient } from "@prisma/client";
import type {
  CompleteMarketRefreshLogInput,
  CreateMarketRefreshLogInput,
  MarketDataCandleSnapshot,
  MarketDataCandleWriteInput,
  MarketDataCurrentPriceSnapshot,
  MarketDataCurrentPriceWriteInput,
  MarketDataSnapshotRepository,
  MarketInfoSnapshot,
  MarketInfoWriteInput,
} from "../../domain/market-data/MarketDataSnapshotRepository";

export class PrismaMarketDataSnapshotRepository
  implements MarketDataSnapshotRepository
{
  constructor(private readonly prisma: PrismaClient) {}

  async findCurrentPrices(input?: {
    symbols?: string[];
  }): Promise<MarketDataCurrentPriceSnapshot[]> {
    const rows =
      input?.symbols && input.symbols.length > 0
        ? await this.prisma.marketPriceCurrent.findMany({
            where: {
              symbol: {
                in: input.symbols,
              },
            },
            orderBy: {
              symbol: "asc",
            },
          })
        : await this.prisma.marketPriceCurrent.findMany({
            orderBy: {
              symbol: "asc",
            },
          });

    return rows.map(mapCurrentPriceSnapshot);
  }

  async upsertCurrentPrices(input: {
    snapshots: MarketDataCurrentPriceWriteInput[];
  }): Promise<void> {
    if (input.snapshots.length === 0) {
      return;
    }

    await this.prisma.$transaction(
      input.snapshots.map((snapshot) =>
        this.prisma.marketPriceCurrent.upsert({
          where: {
            symbol: snapshot.symbol,
          },
          update: {
            markPrice: new Prisma.Decimal(snapshot.markPrice),
            indexPrice:
              snapshot.indexPrice === null
                ? null
                : new Prisma.Decimal(snapshot.indexPrice),
            lastPrice:
              snapshot.lastPrice === null
                ? null
                : new Prisma.Decimal(snapshot.lastPrice),
            volume24h:
              snapshot.volume24h === null
                ? null
                : new Prisma.Decimal(snapshot.volume24h),
            openInterest:
              snapshot.openInterest === null
                ? null
                : new Prisma.Decimal(snapshot.openInterest),
            fundingRate:
              snapshot.fundingRate === null
                ? null
                : new Prisma.Decimal(snapshot.fundingRate),
            capturedAt: new Date(snapshot.capturedAtIso),
            fetchedAt: new Date(snapshot.fetchedAtIso),
            snapshotStatus: snapshot.snapshotStatus,
            source: snapshot.source,
          },
          create: {
            symbol: snapshot.symbol,
            markPrice: new Prisma.Decimal(snapshot.markPrice),
            indexPrice:
              snapshot.indexPrice === null
                ? null
                : new Prisma.Decimal(snapshot.indexPrice),
            lastPrice:
              snapshot.lastPrice === null
                ? null
                : new Prisma.Decimal(snapshot.lastPrice),
            volume24h:
              snapshot.volume24h === null
                ? null
                : new Prisma.Decimal(snapshot.volume24h),
            openInterest:
              snapshot.openInterest === null
                ? null
                : new Prisma.Decimal(snapshot.openInterest),
            fundingRate:
              snapshot.fundingRate === null
                ? null
                : new Prisma.Decimal(snapshot.fundingRate),
            capturedAt: new Date(snapshot.capturedAtIso),
            fetchedAt: new Date(snapshot.fetchedAtIso),
            snapshotStatus: snapshot.snapshotStatus,
            source: snapshot.source,
          },
        }),
      ),
    );
  }

  async listRecentCandles(input: {
    symbol: string;
    interval: MarketDataCandleWriteInput["interval"];
    priceSource: MarketDataCandleWriteInput["priceSource"];
    limit: number;
  }): Promise<MarketDataCandleSnapshot[]> {
    const rows = await this.prisma.marketCandleSnapshot.findMany({
      where: {
        symbol: input.symbol,
        interval: input.interval,
        priceSource: input.priceSource,
      },
      orderBy: {
        openTime: "desc",
      },
      take: input.limit,
    });

    return rows
      .reverse()
      .map(mapCandleSnapshot);
  }

  async insertCandles(input: {
    candles: MarketDataCandleWriteInput[];
  }): Promise<{
    insertedCount: number;
    updatedCount: number;
    refreshedCount: number;
  }> {
    if (input.candles.length === 0) {
      return { insertedCount: 0, updatedCount: 0, refreshedCount: 0 };
    }

    const uniqueKeys = input.candles.map((candle) => ({
      symbol: candle.symbol,
      interval: candle.interval,
      priceSource: candle.priceSource,
      openTime: new Date(candle.openTime),
    }));

    const existingRows = await this.prisma.marketCandleSnapshot.findMany({
      where: {
        OR: uniqueKeys.map((key) => ({
          symbol: key.symbol,
          interval: key.interval,
          priceSource: key.priceSource,
          openTime: key.openTime,
        })),
      },
      select: {
        symbol: true,
        interval: true,
        priceSource: true,
        openTime: true,
      },
    });

    const existingKeys = new Set(
      existingRows.map((row) =>
        buildCandleKey({
          symbol: row.symbol,
          interval: row.interval,
          priceSource: row.priceSource,
          openTime: row.openTime,
        }),
      ),
    );

    await this.prisma.$transaction(
      input.candles.map((candle) =>
        this.prisma.marketCandleSnapshot.upsert({
          where: {
            symbol_interval_priceSource_openTime: {
              symbol: candle.symbol,
              interval: candle.interval,
              priceSource: candle.priceSource,
              openTime: new Date(candle.openTime),
            },
          },
          update: {
            closeTime: new Date(candle.closeTime),
            open: new Prisma.Decimal(candle.open),
            high: new Prisma.Decimal(candle.high),
            low: new Prisma.Decimal(candle.low),
            close: new Prisma.Decimal(candle.close),
            volume: new Prisma.Decimal(candle.volume),
            fetchedAt: new Date(candle.fetchedAtIso),
            snapshotStatus: candle.snapshotStatus,
            source: candle.source,
          },
          create: {
            symbol: candle.symbol,
            interval: candle.interval,
            priceSource: candle.priceSource,
            openTime: new Date(candle.openTime),
            closeTime: new Date(candle.closeTime),
            open: new Prisma.Decimal(candle.open),
            high: new Prisma.Decimal(candle.high),
            low: new Prisma.Decimal(candle.low),
            close: new Prisma.Decimal(candle.close),
            volume: new Prisma.Decimal(candle.volume),
            fetchedAt: new Date(candle.fetchedAtIso),
            snapshotStatus: candle.snapshotStatus,
            source: candle.source,
          },
        }),
      ),
    );

    const insertedCount = input.candles.filter(
      (candle) =>
        !existingKeys.has(
          buildCandleKey({
            symbol: candle.symbol,
            interval: candle.interval,
            priceSource: candle.priceSource,
            openTime: new Date(candle.openTime),
          }),
        ),
    ).length;
    const refreshedCount = input.candles.length;
    const updatedCount = refreshedCount - insertedCount;

    return { insertedCount, updatedCount, refreshedCount };
  }

  async findCurrentMarketInfo(symbol: string): Promise<MarketInfoSnapshot | null> {
    const row = await this.prisma.marketInfoCurrent.findUnique({
      where: {
        symbol,
      },
    });

    return row ? mapMarketInfoSnapshot(row) : null;
  }

  async listCurrentMarketInfos(input?: {
    symbols?: string[];
  }): Promise<MarketInfoSnapshot[]> {
    const rows =
      input?.symbols && input.symbols.length > 0
        ? await this.prisma.marketInfoCurrent.findMany({
            where: {
              symbol: {
                in: input.symbols,
              },
            },
            orderBy: {
              symbol: "asc",
            },
          })
        : await this.prisma.marketInfoCurrent.findMany({
            orderBy: {
              symbol: "asc",
            },
          });

    return rows.map(mapMarketInfoSnapshot);
  }

  async upsertCurrentMarketInfos(input: {
    snapshots: MarketInfoWriteInput[];
  }): Promise<void> {
    if (input.snapshots.length === 0) {
      return;
    }

    await this.prisma.$transaction(
      input.snapshots.map((snapshot) =>
        this.prisma.marketInfoCurrent.upsert({
          where: {
            symbol: snapshot.symbol,
          },
          update: {
            tickSize: new Prisma.Decimal(snapshot.tickSize),
            lotSize: new Prisma.Decimal(snapshot.lotSize),
            minOrderSize: new Prisma.Decimal(snapshot.minOrderSize),
            maxOrderSize:
              snapshot.maxOrderSize === null
                ? null
                : new Prisma.Decimal(snapshot.maxOrderSize),
            maxLeverage:
              snapshot.maxLeverage === null
                ? null
                : new Prisma.Decimal(snapshot.maxLeverage),
            fetchedAt: new Date(snapshot.fetchedAtIso),
            snapshotStatus: snapshot.snapshotStatus,
            source: snapshot.source,
          },
          create: {
            symbol: snapshot.symbol,
            tickSize: new Prisma.Decimal(snapshot.tickSize),
            lotSize: new Prisma.Decimal(snapshot.lotSize),
            minOrderSize: new Prisma.Decimal(snapshot.minOrderSize),
            maxOrderSize:
              snapshot.maxOrderSize === null
                ? null
                : new Prisma.Decimal(snapshot.maxOrderSize),
            maxLeverage:
              snapshot.maxLeverage === null
                ? null
                : new Prisma.Decimal(snapshot.maxLeverage),
            fetchedAt: new Date(snapshot.fetchedAtIso),
            snapshotStatus: snapshot.snapshotStatus,
            source: snapshot.source,
          },
        }),
      ),
    );
  }

  async createRefreshLog(
    input: CreateMarketRefreshLogInput,
  ): Promise<{ id: string }> {
    const row = await this.prisma.marketRefreshLog.create({
      data: {
        refreshType: input.refreshType,
        refreshKey: input.refreshKey,
        startedAt: new Date(input.startedAtIso),
        status: input.status,
      },
      select: {
        id: true,
      },
    });

    return row;
  }

  async completeRefreshLog(input: CompleteMarketRefreshLogInput): Promise<void> {
    await this.prisma.marketRefreshLog.update({
      where: {
        id: input.refreshLogId,
      },
      data: {
        finishedAt: new Date(input.finishedAtIso),
        status: input.status,
        errorMessage: input.errorMessage,
        recordsWritten: input.recordsWritten,
      },
    });
  }

  async deleteOldCandles(input: {
    beforeIso: string;
  }): Promise<{ deletedCount: number }> {
    const result = await this.prisma.marketCandleSnapshot.deleteMany({
      where: {
        fetchedAt: {
          lt: new Date(input.beforeIso),
        },
      },
    });

    return { deletedCount: result.count };
  }

  async deleteOldRefreshLogs(input: {
    beforeIso: string;
  }): Promise<{ deletedCount: number }> {
    const result = await this.prisma.marketRefreshLog.deleteMany({
      where: {
        createdAt: {
          lt: new Date(input.beforeIso),
        },
      },
    });

    return { deletedCount: result.count };
  }
}

function decimalToNumber(value: Prisma.Decimal): number {
  return Number(value.toString());
}

function mapCurrentPriceSnapshot(row: {
  symbol: string;
  markPrice: Prisma.Decimal;
  indexPrice: Prisma.Decimal | null;
  lastPrice: Prisma.Decimal | null;
  volume24h: Prisma.Decimal | null;
  openInterest: Prisma.Decimal | null;
  fundingRate: Prisma.Decimal | null;
  capturedAt: Date;
  fetchedAt: Date;
  snapshotStatus: "confirmed" | "stale" | "unavailable";
  source: string;
}): MarketDataCurrentPriceSnapshot {
  return {
    symbol: row.symbol,
    markPrice: decimalToNumber(row.markPrice),
    indexPrice: row.indexPrice ? decimalToNumber(row.indexPrice) : null,
    lastPrice: row.lastPrice ? decimalToNumber(row.lastPrice) : null,
    volume24h: row.volume24h ? decimalToNumber(row.volume24h) : null,
    openInterest: row.openInterest ? decimalToNumber(row.openInterest) : null,
    fundingRate: row.fundingRate ? decimalToNumber(row.fundingRate) : null,
    capturedAt: row.capturedAt.toISOString(),
    fetchedAt: row.fetchedAt.toISOString(),
    snapshotStatus: row.snapshotStatus,
    source: row.source,
  };
}

function buildCandleKey(input: {
  symbol: string;
  interval: string;
  priceSource: string;
  openTime: Date;
}) {
  return `${input.symbol}:${input.interval}:${input.priceSource}:${input.openTime.toISOString()}`;
}

function mapCandleSnapshot(row: {
  symbol: string;
  interval: string;
  priceSource: "market" | "mark";
  openTime: Date;
  closeTime: Date;
  open: Prisma.Decimal;
  high: Prisma.Decimal;
  low: Prisma.Decimal;
  close: Prisma.Decimal;
  volume: Prisma.Decimal;
  fetchedAt: Date;
  snapshotStatus: "confirmed" | "stale" | "unavailable";
  source: string;
}): MarketDataCandleSnapshot {
  return {
    symbol: row.symbol,
    interval: row.interval as MarketDataCandleSnapshot["interval"],
    openTime: row.openTime.getTime(),
    closeTime: row.closeTime.getTime(),
    open: decimalToNumber(row.open),
    high: decimalToNumber(row.high),
    low: decimalToNumber(row.low),
    close: decimalToNumber(row.close),
    volume: decimalToNumber(row.volume),
    fetchedAt: row.fetchedAt.toISOString(),
    snapshotStatus: row.snapshotStatus,
    source: row.source,
  };
}

function mapMarketInfoSnapshot(row: {
  symbol: string;
  tickSize: Prisma.Decimal;
  lotSize: Prisma.Decimal;
  minOrderSize: Prisma.Decimal;
  maxOrderSize: Prisma.Decimal | null;
  maxLeverage: Prisma.Decimal | null;
  fetchedAt: Date;
  snapshotStatus: "confirmed" | "stale" | "unavailable";
  source: string;
}): MarketInfoSnapshot {
  return {
    symbol: row.symbol,
    tickSize: decimalToNumber(row.tickSize),
    lotSize: decimalToNumber(row.lotSize),
    minOrderSize: decimalToNumber(row.minOrderSize),
    maxOrderSize: row.maxOrderSize ? decimalToNumber(row.maxOrderSize) : null,
    maxLeverage: row.maxLeverage ? decimalToNumber(row.maxLeverage) : null,
    fetchedAt: row.fetchedAt.toISOString(),
    snapshotStatus: row.snapshotStatus,
    source: row.source,
  };
}
