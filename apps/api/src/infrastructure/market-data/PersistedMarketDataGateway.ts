import type {
  MarketCandle,
  MarketCandleRequest,
  MarketInfoItem,
  MarketPriceSnapshot,
} from "@pacifica/contracts";
import type { MarketDataPort } from "../../domain/market-data/MarketDataPort";
import type {
  MarketDataCandleSnapshot,
  MarketDataSnapshotRepository,
} from "../../domain/market-data/MarketDataSnapshotRepository";
import {
  isFreshCandleSnapshot,
  isFreshMarketInfoSnapshot,
  isFreshPriceSnapshot,
  intervalToMilliseconds,
} from "./marketDataFreshness";

export type PersistedMarketDataGatewayDependencies = {
  repository: MarketDataSnapshotRepository;
  refresher: {
    refreshPrices(): Promise<unknown>;
    refreshCandles(input: { requests: MarketCandleRequest[] }): Promise<unknown>;
    refreshMarketInfo(): Promise<unknown>;
  };
  now?: () => Date;
  logger?: {
    info: (message: string, payload?: Record<string, unknown>) => void;
    warn: (message: string, payload?: Record<string, unknown>) => void;
    error: (message: string, payload?: Record<string, unknown>) => void;
  };
};

export class PersistedMarketDataGateway
  implements
    MarketDataPort
{
  private readonly now: () => Date;
  private readonly logger: NonNullable<PersistedMarketDataGatewayDependencies["logger"]>;

  constructor(
    private readonly dependencies: PersistedMarketDataGatewayDependencies,
  ) {
    this.now = dependencies.now ?? (() => new Date());
    this.logger = dependencies.logger ?? console;
  }

  async getPrices(): Promise<MarketPriceSnapshot[]> {
    let snapshots = await this.dependencies.repository.findCurrentPrices();
    const referenceTime = this.now();

    if (snapshots.length === 0) {
      this.logger.warn("api.market_data_prices_cache_miss");
      await this.dependencies.refresher.refreshPrices();
      snapshots = await this.dependencies.repository.findCurrentPrices();
    } else {
      const fresh = snapshots.every((snapshot) =>
        isFreshPriceSnapshot(snapshot.fetchedAt, referenceTime),
      );
      if (fresh) {
        this.logger.info("api.market_data_prices_cache_hit", {
          snapshotCount: snapshots.length,
        });
      } else {
        this.logger.warn("api.market_data_prices_cache_stale", {
          snapshotCount: snapshots.length,
        });
        try {
          await this.dependencies.refresher.refreshPrices();
          snapshots = await this.dependencies.repository.findCurrentPrices();
        } catch {
          this.logger.warn("api.market_data_prices_stale_fallback_served", {
            snapshotCount: snapshots.length,
          });
        }
      }
    }

    if (snapshots.length === 0) {
      throw new Error("Market prices snapshot is unavailable.");
    }

    return snapshots.map(({ fetchedAt: _fetchedAt, snapshotStatus: _status, source: _source, ...price }) => price);
  }

  async getCandles(input: MarketCandleRequest): Promise<MarketCandle[]> {
    const referenceTime = this.now();
    let candles = await this.dependencies.repository.listCandlesInRange({
      symbol: input.symbol,
      interval: input.interval,
      priceSource: input.priceSource,
      startTime: input.startTime,
      endTime: normalizeEndTime(input),
    });
    const enoughCandles = candles.length >= resolveRequestedLimit(input);
    const freshCandles = areCandlesFreshEnough({
      candles,
      request: input,
      referenceTime,
    });

    if (!enoughCandles) {
      this.logger.warn("api.market_data_candles_cache_miss", {
        symbol: input.symbol,
        interval: input.interval,
        priceSource: input.priceSource,
        requestedLimit: resolveRequestedLimit(input),
      });
      await this.dependencies.refresher.refreshCandles({
        requests: [input],
      });
      candles = await this.dependencies.repository.listCandlesInRange({
        symbol: input.symbol,
        interval: input.interval,
        priceSource: input.priceSource,
        startTime: input.startTime,
        endTime: normalizeEndTime(input),
      });
    } else if (!freshCandles) {
      this.logger.warn("api.market_data_candles_cache_stale", {
        symbol: input.symbol,
        interval: input.interval,
        priceSource: input.priceSource,
        cachedCount: candles.length,
      });
      try {
        await this.dependencies.refresher.refreshCandles({
          requests: [input],
        });
        candles = await this.dependencies.repository.listCandlesInRange({
          symbol: input.symbol,
          interval: input.interval,
          priceSource: input.priceSource,
          startTime: input.startTime,
          endTime: normalizeEndTime(input),
        });
      } catch {
        this.logger.warn("api.market_data_candles_stale_fallback_served", {
          symbol: input.symbol,
          interval: input.interval,
          priceSource: input.priceSource,
          cachedCount: candles.length,
        });
      }
    } else {
      this.logger.info("api.market_data_candles_cache_hit", {
        symbol: input.symbol,
        interval: input.interval,
        priceSource: input.priceSource,
        cachedCount: candles.length,
      });
    }

    if (candles.length === 0) {
      throw new Error("Market candles snapshot is unavailable.");
    }

    return candles.map(
      ({ fetchedAt: _fetchedAt, snapshotStatus: _status, source: _source, ...candle }) =>
        candle,
    );
  }

  async listMarketInfo(): Promise<MarketInfoItem[]> {
    let markets = await this.dependencies.repository.listCurrentMarketInfos();
    const referenceTime = this.now();

    if (markets.length === 0) {
      this.logger.warn("api.market_data_market_info_cache_miss");
      await this.dependencies.refresher.refreshMarketInfo();
      markets = await this.dependencies.repository.listCurrentMarketInfos();
    } else {
      const fresh = markets.every((market) =>
        isFreshMarketInfoSnapshot(market.fetchedAt, referenceTime),
      );
      if (fresh) {
        this.logger.info("api.market_data_market_info_cache_hit", {
          marketCount: markets.length,
        });
      } else {
        this.logger.warn("api.market_data_market_info_cache_stale", {
          marketCount: markets.length,
        });
        try {
          await this.dependencies.refresher.refreshMarketInfo();
          markets = await this.dependencies.repository.listCurrentMarketInfos();
        } catch {
          this.logger.warn("api.market_data_market_info_stale_fallback_served", {
            marketCount: markets.length,
          });
        }
      }
    }

    if (markets.length === 0) {
      throw new Error("Market info snapshot is unavailable.");
    }

    return markets
      .sort((left, right) => left.symbol.localeCompare(right.symbol))
      .map((market) => ({
        symbol: market.symbol,
        tickSize: String(market.tickSize),
        lotSize: String(market.lotSize),
        minOrderSize: String(market.minOrderSize),
        maxLeverage: market.maxLeverage ? Math.trunc(market.maxLeverage) : 1,
      }));
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

function areCandlesFreshEnough(input: {
  candles: MarketDataCandleSnapshot[];
  request: MarketCandleRequest;
  referenceTime: Date;
}) {
  if (input.candles.length === 0) {
    return false;
  }

  if (!requestTouchesRecentWindow(input.request, input.referenceTime)) {
    return true;
  }

  const latestCandle = input.candles.at(-1);
  if (!latestCandle) {
    return false;
  }
  return isFreshCandleSnapshot({
    fetchedAtIso: latestCandle.fetchedAt,
    interval: latestCandle.interval,
    referenceTime: input.referenceTime,
  });
}

function requestTouchesRecentWindow(
  input: MarketCandleRequest,
  referenceTime: Date,
) {
  const freshnessThresholdMs = intervalToMilliseconds(input.interval) + 60_000;
  return normalizeEndTime(input) >= referenceTime.getTime() - freshnessThresholdMs;
}
