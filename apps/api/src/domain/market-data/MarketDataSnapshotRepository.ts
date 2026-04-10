import type { MarketCandle, MarketCandleRequest, MarketPriceSnapshot } from "@pacifica/contracts";

export type MarketSnapshotStatus = "confirmed" | "stale" | "unavailable";

export type MarketDataCurrentPriceSnapshot = MarketPriceSnapshot & {
  fetchedAt: string;
  snapshotStatus: MarketSnapshotStatus;
  source: string;
};

export type MarketDataCurrentPriceWriteInput = {
  symbol: string;
  markPrice: number;
  indexPrice: number | null;
  lastPrice: number | null;
  volume24h: number | null;
  openInterest: number | null;
  fundingRate: number | null;
  capturedAtIso: string;
  fetchedAtIso: string;
  snapshotStatus: MarketSnapshotStatus;
  source: string;
};

export type MarketDataCandleSnapshot = MarketCandle & {
  fetchedAt: string;
  snapshotStatus: MarketSnapshotStatus;
  source: string;
};

export type MarketDataCandleWriteInput = {
  symbol: string;
  interval: MarketCandleRequest["interval"];
  priceSource: MarketCandleRequest["priceSource"];
  openTime: number;
  closeTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  fetchedAtIso: string;
  snapshotStatus: MarketSnapshotStatus;
  source: string;
};

export type MarketInfoSnapshot = {
  symbol: string;
  tickSize: number;
  lotSize: number;
  minOrderSize: number;
  maxOrderSize: number | null;
  maxLeverage: number | null;
  fetchedAt: string;
  snapshotStatus: MarketSnapshotStatus;
  source: string;
};

export type MarketInfoWriteInput = {
  symbol: string;
  tickSize: number;
  lotSize: number;
  minOrderSize: number;
  maxOrderSize: number | null;
  maxLeverage: number | null;
  fetchedAtIso: string;
  snapshotStatus: MarketSnapshotStatus;
  source: string;
};

export type CreateMarketRefreshLogInput = {
  refreshType: string;
  refreshKey: string;
  startedAtIso: string;
  status: string;
};

export type CompleteMarketRefreshLogInput = {
  refreshLogId: string;
  finishedAtIso: string;
  status: string;
  errorMessage: string | null;
  recordsWritten: number;
};

export type DeleteOldMarketDataSnapshotsInput = {
  beforeIso: string;
};

export interface MarketDataSnapshotRepository {
  findCurrentPrices(input?: {
    symbols?: string[];
  }): Promise<MarketDataCurrentPriceSnapshot[]>;
  upsertCurrentPrices(input: {
    snapshots: MarketDataCurrentPriceWriteInput[];
  }): Promise<void>;
  listRecentCandles(input: {
    symbol: string;
    interval: MarketCandleRequest["interval"];
    priceSource: MarketCandleRequest["priceSource"];
    limit: number;
  }): Promise<MarketDataCandleSnapshot[]>;
  listCandlesInRange(input: {
    symbol: string;
    interval: MarketCandleRequest["interval"];
    priceSource: MarketCandleRequest["priceSource"];
    startTime: number;
    endTime: number;
  }): Promise<MarketDataCandleSnapshot[]>;
  insertCandles(input: {
    candles: MarketDataCandleWriteInput[];
  }): Promise<{
    insertedCount: number;
    updatedCount: number;
    refreshedCount: number;
  }>;
  findCurrentMarketInfo(symbol: string): Promise<MarketInfoSnapshot | null>;
  listCurrentMarketInfos(input?: {
    symbols?: string[];
  }): Promise<MarketInfoSnapshot[]>;
  upsertCurrentMarketInfos(input: {
    snapshots: MarketInfoWriteInput[];
  }): Promise<void>;
  createRefreshLog(input: CreateMarketRefreshLogInput): Promise<{ id: string }>;
  completeRefreshLog(input: CompleteMarketRefreshLogInput): Promise<void>;
  deleteOldCandles(
    input: DeleteOldMarketDataSnapshotsInput,
  ): Promise<{ deletedCount: number }>;
  deleteOldRefreshLogs(
    input: DeleteOldMarketDataSnapshotsInput,
  ): Promise<{ deletedCount: number }>;
}
