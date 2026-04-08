import type { MarketCandleInterval } from "@pacifica/contracts";

export const MARKET_DATA_FRESHNESS_POLICY = {
  pricesFreshForMs: 3 * 60_000,
  marketInfoFreshForMs: 6 * 60 * 60_000,
  candleExtraToleranceMs: 60_000,
} as const;

export function isFreshPriceSnapshot(
  fetchedAtIso: string,
  referenceTime: Date,
): boolean {
  return ageMs(fetchedAtIso, referenceTime) <= MARKET_DATA_FRESHNESS_POLICY.pricesFreshForMs;
}

export function isFreshMarketInfoSnapshot(
  fetchedAtIso: string,
  referenceTime: Date,
): boolean {
  return (
    ageMs(fetchedAtIso, referenceTime) <=
    MARKET_DATA_FRESHNESS_POLICY.marketInfoFreshForMs
  );
}

export function isFreshCandleSnapshot(input: {
  fetchedAtIso: string;
  interval: MarketCandleInterval;
  referenceTime: Date;
}): boolean {
  return (
    ageMs(input.fetchedAtIso, input.referenceTime) <=
    intervalToMilliseconds(input.interval) +
      MARKET_DATA_FRESHNESS_POLICY.candleExtraToleranceMs
  );
}

function ageMs(fetchedAtIso: string, referenceTime: Date) {
  return referenceTime.getTime() - new Date(fetchedAtIso).getTime();
}

export function intervalToMilliseconds(interval: MarketCandleInterval): number {
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
