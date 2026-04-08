import type { MarketCandleInterval } from "@pacifica/contracts";

export function alignToLastClosedCandleEndTime(
  referenceTimeMs: number,
  interval: MarketCandleInterval,
) {
  const intervalMs = intervalToMilliseconds(interval);
  return Math.floor(referenceTimeMs / intervalMs) * intervalMs;
}

export function intervalToMilliseconds(interval: MarketCandleInterval) {
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
