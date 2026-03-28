import type {
  MarketCandle,
  MarketCandleRequest,
  MarketPriceSnapshot,
} from "@pacifica/contracts";

export interface MarketDataPort {
  getPrices(): Promise<MarketPriceSnapshot[]>;
  getCandles(input: MarketCandleRequest): Promise<MarketCandle[]>;
}
