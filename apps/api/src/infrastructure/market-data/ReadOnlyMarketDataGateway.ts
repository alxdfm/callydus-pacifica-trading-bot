import type {
  MarketCandle,
  MarketCandleRequest,
  MarketPriceSnapshot,
} from "@pacifica/contracts";
import type { MarketDataPort } from "../../domain/market-data/MarketDataPort";
import type { MarketDataSnapshotRepository } from "../../domain/market-data/MarketDataSnapshotRepository";
import { intervalToMilliseconds } from "./marketDataFreshness";

/**
 * Read-only market data gateway that serves candles and prices exclusively
 * from the local database snapshot — never triggers a Pacifica refresh.
 *
 * Intended for use cases that must not block on external I/O, such as
 * backtest previews where data freshness is handled by the background
 * market data scheduler.
 */
export class ReadOnlyMarketDataGateway implements MarketDataPort {
  constructor(private readonly repository: MarketDataSnapshotRepository) {}

  async getPrices(): Promise<MarketPriceSnapshot[]> {
    const snapshots = await this.repository.findCurrentPrices();
    if (snapshots.length === 0) {
      throw new Error("Market prices snapshot is unavailable.");
    }
    return snapshots.map(
      ({ fetchedAt: _f, snapshotStatus: _s, source: _src, ...price }) => price,
    );
  }

  async getCandles(input: MarketCandleRequest): Promise<MarketCandle[]> {
    const endTime = resolveEndTime(input);
    const candles = await this.repository.listCandlesInRange({
      symbol: input.symbol,
      interval: input.interval,
      priceSource: input.priceSource,
      startTime: input.startTime,
      endTime,
    });
    return candles.map(
      ({ fetchedAt: _f, snapshotStatus: _s, source: _src, ...candle }) =>
        candle,
    );
  }
}

function resolveEndTime(input: MarketCandleRequest): number {
  if (typeof input.endTime === "number") return input.endTime;
  if (typeof input.limit === "number") {
    return (
      input.startTime + intervalToMilliseconds(input.interval) * input.limit
    );
  }
  return input.startTime + intervalToMilliseconds(input.interval);
}
