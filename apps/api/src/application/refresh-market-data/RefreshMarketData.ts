import type { MarketCandleRequest, MarketInfoItem } from "@pacifica/contracts";
import type { MarketDataPort } from "../../domain/market-data/MarketDataPort";
import type { MarketDataSnapshotRepository } from "../../domain/market-data/MarketDataSnapshotRepository";

export type RefreshPricesResult = {
  refreshLogId: string;
  refreshedCount: number;
  fetchedAtIso: string;
};

export type RefreshCandlesInput = {
  requests: MarketCandleRequest[];
};

export type RefreshCandlesResult = {
  refreshLogId: string;
  insertedCount: number;
  updatedCount: number;
  refreshedCount: number;
  fetchedAtIso: string;
};

export type RefreshMarketInfoResult = {
  refreshLogId: string;
  refreshedCount: number;
  fetchedAtIso: string;
};

export type RefreshMarketDataDependencies = {
  marketData: MarketDataPort;
  marketInfo: {
    listMarketInfo(): Promise<MarketInfoItem[]>;
  };
  repository: MarketDataSnapshotRepository;
  now?: () => Date;
  source?: string;
};

export function createMarketDataRefresher(
  dependencies: RefreshMarketDataDependencies,
) {
  const getNow = dependencies.now ?? (() => new Date());
  const source = dependencies.source ?? "pacifica-market-data-refresher";

  async function refreshPrices(): Promise<RefreshPricesResult> {
    const startedAtIso = getNow().toISOString();
    const refreshLog = await dependencies.repository.createRefreshLog({
      refreshType: "prices",
      refreshKey: "prices:all",
      startedAtIso,
      status: "running",
    });

    try {
      const prices = await dependencies.marketData.getPrices();
      const fetchedAtIso = getNow().toISOString();

      await dependencies.repository.upsertCurrentPrices({
        snapshots: prices.map((price) => ({
          symbol: price.symbol,
          markPrice: price.markPrice,
          indexPrice: price.indexPrice ?? null,
          lastPrice: price.lastPrice ?? null,
          volume24h: price.volume24h ?? null,
          openInterest: price.openInterest ?? null,
          fundingRate: price.fundingRate ?? null,
          capturedAtIso: price.capturedAt,
          fetchedAtIso,
          snapshotStatus: "confirmed",
          source,
        })),
      });

      await dependencies.repository.completeRefreshLog({
        refreshLogId: refreshLog.id,
        finishedAtIso: fetchedAtIso,
        status: "completed",
        errorMessage: null,
        recordsWritten: prices.length,
      });

      return {
        refreshLogId: refreshLog.id,
        refreshedCount: prices.length,
        fetchedAtIso,
      };
    } catch (error) {
      const finishedAtIso = getNow().toISOString();

      await dependencies.repository.completeRefreshLog({
        refreshLogId: refreshLog.id,
        finishedAtIso,
        status: "failed",
        errorMessage: error instanceof Error ? error.message : String(error),
        recordsWritten: 0,
      });

      throw error;
    }
  }

  async function refreshCandles(
    input: RefreshCandlesInput,
  ): Promise<RefreshCandlesResult> {
    const startedAtIso = getNow().toISOString();
    const refreshLog = await dependencies.repository.createRefreshLog({
      refreshType: "candles",
      refreshKey: buildCandleRefreshKey(input.requests),
      startedAtIso,
      status: "running",
    });

    try {
      const fetchedAtIso = getNow().toISOString();
      const candlesPerRequest = await Promise.all(
        input.requests.map(async (request) => {
          const candles = await dependencies.marketData.getCandles(request);

          return candles.map((candle) => ({
            symbol: candle.symbol,
            interval: candle.interval,
            priceSource: request.priceSource,
            openTime: candle.openTime,
            closeTime: candle.closeTime,
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
            volume: candle.volume,
            fetchedAtIso,
            snapshotStatus: "confirmed" as const,
            source,
          }));
        }),
      );

      const flattenedCandles = candlesPerRequest.flat();
      const { insertedCount, updatedCount, refreshedCount } =
        await dependencies.repository.insertCandles({
        candles: flattenedCandles,
      });

      await dependencies.repository.completeRefreshLog({
        refreshLogId: refreshLog.id,
        finishedAtIso: getNow().toISOString(),
        status: "completed",
        errorMessage: null,
        recordsWritten: refreshedCount,
      });

      return {
        refreshLogId: refreshLog.id,
        insertedCount,
        updatedCount,
        refreshedCount,
        fetchedAtIso,
      };
    } catch (error) {
      const finishedAtIso = getNow().toISOString();

      await dependencies.repository.completeRefreshLog({
        refreshLogId: refreshLog.id,
        finishedAtIso,
        status: "failed",
        errorMessage: error instanceof Error ? error.message : String(error),
        recordsWritten: 0,
      });

      throw error;
    }
  }

  async function refreshMarketInfo(): Promise<RefreshMarketInfoResult> {
    const startedAtIso = getNow().toISOString();
    const refreshLog = await dependencies.repository.createRefreshLog({
      refreshType: "market_info",
      refreshKey: "market_info:all",
      startedAtIso,
      status: "running",
    });

    try {
      const markets = await dependencies.marketInfo.listMarketInfo();
      const fetchedAtIso = getNow().toISOString();

      await dependencies.repository.upsertCurrentMarketInfos({
        snapshots: markets.map((market) => ({
          symbol: market.symbol,
          tickSize: Number(market.tickSize),
          lotSize: Number(market.lotSize),
          minOrderSize: Number(market.minOrderSize),
          maxOrderSize: null,
          maxLeverage: market.maxLeverage,
          fetchedAtIso,
          snapshotStatus: "confirmed",
          source,
        })),
      });

      await dependencies.repository.completeRefreshLog({
        refreshLogId: refreshLog.id,
        finishedAtIso: fetchedAtIso,
        status: "completed",
        errorMessage: null,
        recordsWritten: markets.length,
      });

      return {
        refreshLogId: refreshLog.id,
        refreshedCount: markets.length,
        fetchedAtIso,
      };
    } catch (error) {
      const finishedAtIso = getNow().toISOString();

      await dependencies.repository.completeRefreshLog({
        refreshLogId: refreshLog.id,
        finishedAtIso,
        status: "failed",
        errorMessage: error instanceof Error ? error.message : String(error),
        recordsWritten: 0,
      });

      throw error;
    }
  }

  return {
    refreshPrices,
    refreshCandles,
    refreshMarketInfo,
  };
}

function buildCandleRefreshKey(requests: MarketCandleRequest[]) {
  return requests
    .map((request) => `${request.symbol}:${request.interval}:${request.priceSource}`)
    .sort()
    .join("|");
}
