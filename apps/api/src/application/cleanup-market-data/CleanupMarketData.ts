import type { MarketDataSnapshotRepository } from "../../domain/market-data/MarketDataSnapshotRepository";

export type CleanupMarketDataInput = {
  candleRetentionMs: number;
  refreshLogRetentionMs: number;
};

export type CleanupMarketDataOutput = {
  status: "success";
  candlesDeleted: number;
  refreshLogsDeleted: number;
  executedAtIso: string;
};

export type CleanupMarketDataDependencies = {
  repository: MarketDataSnapshotRepository;
  now?: () => Date;
  logger?: {
    info: (message: string, payload?: Record<string, unknown>) => void;
  };
};

export function createCleanupMarketData(
  dependencies: CleanupMarketDataDependencies,
) {
  const now = dependencies.now ?? (() => new Date());
  const logger = dependencies.logger ?? console;

  return async function cleanupMarketData(
    input: CleanupMarketDataInput,
  ): Promise<CleanupMarketDataOutput> {
    const executedAt = now();
    const candleBeforeIso = new Date(
      executedAt.getTime() - input.candleRetentionMs,
    ).toISOString();
    const refreshLogBeforeIso = new Date(
      executedAt.getTime() - input.refreshLogRetentionMs,
    ).toISOString();

    const [candlesResult, refreshLogsResult] = await Promise.all([
      dependencies.repository.deleteOldCandles({
        beforeIso: candleBeforeIso,
      }),
      dependencies.repository.deleteOldRefreshLogs({
        beforeIso: refreshLogBeforeIso,
      }),
    ]);

    logger.info("market_data_cleanup.completed", {
      executedAtIso: executedAt.toISOString(),
      candlesDeleted: candlesResult.deletedCount,
      refreshLogsDeleted: refreshLogsResult.deletedCount,
    });

    return {
      status: "success",
      candlesDeleted: candlesResult.deletedCount,
      refreshLogsDeleted: refreshLogsResult.deletedCount,
      executedAtIso: executedAt.toISOString(),
    };
  };
}
