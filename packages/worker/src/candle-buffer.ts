import type { Candle, CandleInterval } from "@pacifica/shared";

export type CandleBufferKey = `${string}_${string}`;

export class CandleBuffer {
  private readonly buffers = new Map<CandleBufferKey, Candle[]>();
  private readonly capacity: number;

  constructor(capacity = 300) {
    this.capacity = capacity;
  }

  push(symbol: string, interval: CandleInterval, candle: Candle): void {
    const key: CandleBufferKey = `${symbol}_${interval}`;
    const buffer = this.buffers.get(key) ?? [];
    buffer.push(candle);
    if (buffer.length > this.capacity) buffer.shift();
    this.buffers.set(key, buffer);
  }

  get(symbol: string, interval: CandleInterval): Candle[] {
    return this.buffers.get(`${symbol}_${interval}`) ?? [];
  }

  isWarm(symbol: string, interval: CandleInterval, minCandles = 50): boolean {
    return this.get(symbol, interval).length >= minCandles;
  }
}
