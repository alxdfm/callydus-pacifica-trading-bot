import type { MarketCandleInterval } from "@pacifica/contracts";
import type { PrismaClient } from "@prisma/client";
import { toPacificaMarketSymbol } from "@pacifica/preset-engine";
import type { SchedulerCandleRequestConfig } from "./startLocalMarketDataRefreshScheduler";

type ActivePresetRecord = {
  symbol: string;
  effectiveContractJson: unknown;
};

const supportedIntervals = new Set<MarketCandleInterval>([
  "1m",
  "3m",
  "5m",
  "15m",
  "30m",
  "1h",
  "2h",
  "4h",
  "6h",
  "12h",
  "1d",
]);

export function createActivePresetMarketDataRequestResolver(input: {
  prisma: PrismaClient;
  defaultLimit?: number;
}) {
  const defaultLimit = input.defaultLimit ?? 120;

  return async function resolveActivePresetMarketDataRequests(): Promise<
    SchedulerCandleRequestConfig[]
  > {
    const rows = await input.prisma.botRuntimeState.findMany({
      where: {
        activePresetActivationId: {
          not: null,
        },
        activePresetActivation: {
          is: {
            activationStatus: "active",
          },
        },
      },
      select: {
        activePresetActivation: {
          select: {
            symbol: true,
            effectiveContractJson: true,
          },
        },
      },
    });

    const deduplicated = new Map<string, SchedulerCandleRequestConfig>();

    for (const row of rows) {
      const activation = row.activePresetActivation as ActivePresetRecord | null;

      if (!activation) {
        continue;
      }

      const timeframe = extractTimeframe(activation.effectiveContractJson);
      const marketSymbol = toPacificaMarketSymbol(activation.symbol);

      if (!timeframe || !marketSymbol) {
        continue;
      }

      const key = `${marketSymbol}:${timeframe}:market`;

      deduplicated.set(key, {
        symbol: marketSymbol,
        interval: timeframe,
        priceSource: "market",
        limit: defaultLimit,
      });
    }

    return Array.from(deduplicated.values()).sort((left, right) => {
      const symbolComparison = left.symbol.localeCompare(right.symbol);

      if (symbolComparison !== 0) {
        return symbolComparison;
      }

      return left.interval.localeCompare(right.interval);
    });
  };
}

function extractTimeframe(value: unknown): MarketCandleInterval | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const timeframe = (value as { timeframe?: unknown }).timeframe;

  if (typeof timeframe !== "string" || !supportedIntervals.has(timeframe as MarketCandleInterval)) {
    return null;
  }

  return timeframe as MarketCandleInterval;
}
