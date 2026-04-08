import { Prisma, PrismaClient } from "@prisma/client";
import type { MarketCandle, MarketCandleRequest } from "@pacifica/contracts";

type MarketDataProvider = {
  getCandles(input: MarketCandleRequest): Promise<MarketCandle[]>;
};

type WorkerLogger = {
  info: (message: string, payload?: Record<string, unknown>) => void;
  warn: (message: string, payload?: Record<string, unknown>) => void;
  error: (message: string, payload?: Record<string, unknown>) => void;
};

const defaultLogger: WorkerLogger = {
  info(message, payload) {
    console.info(message, payload ?? {});
  },
  warn(message, payload) {
    console.warn(message, payload ?? {});
  },
  error(message, payload) {
    console.error(message, payload ?? {});
  },
};

export class PersistedWorkerMarketDataGateway {
  private readonly logger: WorkerLogger;
  private readonly now: () => Date;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly fallback: MarketDataProvider,
    logger?: WorkerLogger,
    now?: () => Date,
  ) {
    this.logger = logger ?? defaultLogger;
    this.now = now ?? (() => new Date());
  }

  async getCandles(input: MarketCandleRequest): Promise<MarketCandle[]> {
    const requestedLimit = resolveRequestedLimit(input);
    const referenceTime = this.now();
    let candles = filterCandlesByRequest(
      await this.prisma.marketCandleSnapshot.findMany({
        where: {
          symbol: input.symbol,
          interval: input.interval,
          priceSource: input.priceSource,
        },
        orderBy: {
          openTime: "desc",
        },
        take: requestedLimit,
      }),
      input,
    );

    const freshEnough =
      candles.length >= requestedLimit &&
      candles.every((candle) =>
        isFreshCandleSnapshot({
          fetchedAt: candle.fetchedAt,
          interval: candle.interval,
          referenceTime,
        }),
      );

    if (freshEnough) {
      this.logger.info("worker.market_data_snapshot_cache_hit", {
        symbol: input.symbol,
        interval: input.interval,
        priceSource: input.priceSource,
        requestedLimit,
        cachedCount: candles.length,
      });
      return candles.map(({ fetchedAt: _fetchedAt, ...candle }) => candle);
    }

    this.logger.warn("worker.market_data_snapshot_cache_miss", {
      symbol: input.symbol,
      interval: input.interval,
      priceSource: input.priceSource,
      requestedLimit,
      cachedCount: candles.length,
      stale: candles.length > 0,
    });

    try {
      const fetchedCandles = await this.fallback.getCandles(input);
      const fetchedAt = new Date();

      if (fetchedCandles.length > 0) {
        await this.prisma.$transaction(
          fetchedCandles.map((candle) =>
            this.prisma.marketCandleSnapshot.upsert({
              where: {
                symbol_interval_priceSource_openTime: {
                  symbol: candle.symbol,
                  interval: candle.interval,
                  priceSource: input.priceSource,
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
                fetchedAt,
                snapshotStatus: "confirmed",
                source: "worker-fallback-fill",
              },
              create: {
                symbol: candle.symbol,
                interval: candle.interval,
                priceSource: input.priceSource,
                openTime: new Date(candle.openTime),
                closeTime: new Date(candle.closeTime),
                open: new Prisma.Decimal(candle.open),
                high: new Prisma.Decimal(candle.high),
                low: new Prisma.Decimal(candle.low),
                close: new Prisma.Decimal(candle.close),
                volume: new Prisma.Decimal(candle.volume),
                fetchedAt,
                snapshotStatus: "confirmed",
                source: "worker-fallback-fill",
              },
            }),
          ),
        );
      }

      return fetchedCandles;
    } catch (error) {
      if (candles.length > 0) {
        this.logger.warn("worker.market_data_snapshot_stale_fallback_served", {
          symbol: input.symbol,
          interval: input.interval,
          priceSource: input.priceSource,
          requestedLimit,
          cachedCount: candles.length,
          errorMessage: error instanceof Error ? error.message : String(error),
        });
        return candles.map(({ fetchedAt: _fetchedAt, ...candle }) => candle);
      }

      throw error;
    }
  }
}

function resolveRequestedLimit(input: MarketCandleRequest) {
  if (typeof input.limit === "number") {
    return input.limit;
  }

  const endTime = normalizeEndTime(input);
  const intervalMs = intervalToMilliseconds(input.interval);
  return Math.max(1, Math.ceil((endTime - input.startTime) / intervalMs));
}

function normalizeEndTime(input: MarketCandleRequest): number {
  if (typeof input.endTime === "number") {
    return input.endTime;
  }

  if (typeof input.limit === "number") {
    return input.startTime + intervalToMilliseconds(input.interval) * input.limit;
  }

  return input.startTime + intervalToMilliseconds(input.interval);
}

function filterCandlesByRequest(
  candles: Array<{
    symbol: string;
    interval: string;
    fetchedAt: Date;
    openTime: Date;
    closeTime: Date;
    open: Prisma.Decimal;
    high: Prisma.Decimal;
    low: Prisma.Decimal;
    close: Prisma.Decimal;
    volume: Prisma.Decimal;
  }>,
  input: MarketCandleRequest,
): Array<MarketCandle & { fetchedAt: string }> {
  const endTime = normalizeEndTime(input);

  return candles
    .filter(
      (candle) =>
        candle.openTime.getTime() >= input.startTime &&
        candle.closeTime.getTime() <= endTime,
    )
    .sort((left, right) => left.openTime.getTime() - right.openTime.getTime())
    .map((candle) => ({
      symbol: candle.symbol,
      interval: candle.interval as MarketCandleRequest["interval"],
      fetchedAt: candle.fetchedAt.toISOString(),
      openTime: candle.openTime.getTime(),
      closeTime: candle.closeTime.getTime(),
      open: Number(candle.open.toString()),
      high: Number(candle.high.toString()),
      low: Number(candle.low.toString()),
      close: Number(candle.close.toString()),
      volume: Number(candle.volume.toString()),
    }));
}

function isFreshCandleSnapshot(input: {
  fetchedAt: string;
  interval: MarketCandleRequest["interval"];
  referenceTime: Date;
}) {
  return (
    input.referenceTime.getTime() - new Date(input.fetchedAt).getTime() <=
    intervalToMilliseconds(input.interval) + 60_000
  );
}

function intervalToMilliseconds(interval: MarketCandleRequest["interval"]) {
  switch (interval) {
    case "1m":
      return 60_000;
    case "3m":
      return 180_000;
    case "5m":
      return 300_000;
    case "15m":
      return 900_000;
    case "30m":
      return 1_800_000;
    case "1h":
      return 3_600_000;
    case "2h":
      return 7_200_000;
    case "4h":
      return 14_400_000;
    case "6h":
      return 21_600_000;
    case "12h":
      return 43_200_000;
    case "1d":
      return 86_400_000;
  }
}
