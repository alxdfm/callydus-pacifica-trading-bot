import { describe, it, expect } from "vitest";
import { parseKlinePayload } from "../candle-fetch.js";
import { parseMarketInfoSnapshots } from "../market-snapshot.js";
import { resolveCandlePairs } from "../handler.js";

// ---------------------------------------------------------------------------
// candle-fetch: o parse do /api/v1/kline é a única fonte de candles do worker
// agendado — um shape mal interpretado significa avaliação sobre lixo
// ---------------------------------------------------------------------------

describe("parseKlinePayload", () => {
  it("parses snake_case rows wrapped in a data envelope", () => {
    const payload = {
      data: [
        {
          open_time: 1_000,
          close_time: 4_600_000,
          open: "100",
          high: "110",
          low: "90",
          close: "105",
          volume: "12.5",
        },
      ],
    };

    const candles = parseKlinePayload(payload, "BTC", "1h" as const);

    expect(candles).toHaveLength(1);
    expect(candles[0]).toMatchObject({
      symbol: "BTC",
      interval: "1h",
      openTime: 1_000,
      closeTime: 4_600_000,
      open: 100,
      high: 110,
      low: 90,
      close: 105,
      volume: 12.5,
    });
  });

  it("parses the compact ws-style keys (t/T/o/h/l/c/v)", () => {
    const payload = {
      data: [{ t: 1, T: 2, o: 1, h: 2, l: 0.5, c: 1.5, v: 3 }],
    };

    const candles = parseKlinePayload(payload, "ETH", "4h" as const);

    expect(candles).toHaveLength(1);
    expect(candles[0]?.close).toBe(1.5);
  });

  it("drops rows with unparseable required fields instead of producing NaN", () => {
    const payload = {
      data: [
        { t: 1, T: 2, o: "abc", h: 2, l: 0.5, c: 1.5 },
        { t: 3, T: 4, o: 1, h: 2, l: 0.5, c: 1.5 },
      ],
    };

    const candles = parseKlinePayload(payload, "BTC", "1h" as const);

    expect(candles).toHaveLength(1);
    expect(candles[0]?.openTime).toBe(3);
  });

  it("returns empty for a payload without an array", () => {
    expect(parseKlinePayload({ data: null }, "BTC", "1h" as const)).toEqual([]);
    expect(parseKlinePayload("nope", "BTC", "1h" as const)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// market-snapshot: substitui o recorder do WS — 1 linha/símbolo/hora
// ---------------------------------------------------------------------------

describe("parseMarketInfoSnapshots", () => {
  const recordedAt = new Date("2026-07-14T15:00:00.000Z");

  it("keeps only wanted symbols and maps snake_case fields", () => {
    const payload = {
      data: [
        {
          symbol: "BTC",
          funding_rate: "0.0001",
          next_funding_rate: "0.0002",
          open_interest: "1234.5",
          mark_price: "100000",
        },
        { symbol: "DOGE", funding_rate: "0.001" },
      ],
    };

    const rows = parseMarketInfoSnapshots(payload, ["BTC", "ETH"], recordedAt);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      symbol: "BTC",
      fundingRate: "0.0001",
      nextFundingRate: "0.0002",
      openInterest: "1234.5",
      markPrice: "100000",
      recordedAt,
    });
  });

  it("keeps absent fields null instead of zero", () => {
    const payload = { data: [{ symbol: "SOL", funding: "0.0003" }] };

    const rows = parseMarketInfoSnapshots(payload, ["SOL"], recordedAt);

    expect(rows[0]?.fundingRate).toBe("0.0003");
    expect(rows[0]?.openInterest).toBeNull();
    expect(rows[0]?.markPrice).toBeNull();
  });

  it("drops rows where every market field is null (endpoint shape drift)", () => {
    const payload = {
      data: [{ symbol: "BTC", tick_size: "0.1", lot_size: "0.001" }],
    };

    expect(parseMarketInfoSnapshots(payload, ["BTC"], recordedAt)).toEqual([]);
  });

  it("accepts an object keyed by symbol", () => {
    const payload = {
      data: { BTC: { funding_rate: "0.0001" }, ETH: { funding_rate: "0.0004" } },
    };

    const rows = parseMarketInfoSnapshots(payload, ["ETH"], recordedAt);

    expect(rows).toHaveLength(1);
    expect(rows[0]?.symbol).toBe("ETH");
  });

  it("maps the full ws prices-channel shape (the only source of OI/mark/volume)", () => {
    const payload = {
      data: [
        {
          symbol: "BTC",
          funding: "0.0000125",
          next_funding: "0.0000125",
          open_interest: "499.22953",
          oracle: "64980",
          mark: "64976",
          mid: "64977.5",
          volume_24h: "502703208.58",
          timestamp: 1_784_000_000_000,
        },
      ],
    };

    const rows = parseMarketInfoSnapshots(payload, ["BTC"], recordedAt);

    expect(rows[0]).toMatchObject({
      symbol: "BTC",
      fundingRate: "0.0000125",
      openInterest: "499.22953",
      oraclePrice: "64980",
      markPrice: "64976",
      midPrice: "64977.5",
      volume24h: "502703208.58",
    });
  });
});

// ---------------------------------------------------------------------------
// handler: os pares (símbolo, timeframe) vêm das estratégias ativas — par
// faltando significa estratégia que nunca avalia, e em silêncio
// ---------------------------------------------------------------------------

describe("resolveCandlePairs", () => {
  it("derives exact pairs from strategies, deduplicated", () => {
    const strategies = [
      { config: { symbol: "BTC/USDC", timeframe: "4h" } },
      { config: { symbol: "BTC/USDC", timeframe: "4h" } },
      { config: { symbol: "ETH/USDC", timeframe: "1h" } },
    ];

    expect(resolveCandlePairs(strategies)).toEqual([
      { symbol: "BTC", interval: "4h" },
      { symbol: "ETH", interval: "1h" },
    ]);
  });

  it("does not cross-multiply symbols and timeframes", () => {
    const strategies = [
      { config: { symbol: "BTC/USDC", timeframe: "4h" } },
      { config: { symbol: "ETH/USDC", timeframe: "1h" } },
    ];

    const pairs = resolveCandlePairs(strategies);

    expect(pairs).toHaveLength(2);
    expect(pairs).not.toContainEqual({ symbol: "BTC", interval: "1h" });
  });

  it("skips strategies with malformed symbol or missing timeframe", () => {
    const strategies = [
      { config: { symbol: "BTCUSDC", timeframe: "4h" } },
      { config: { symbol: "BTC/USDC" } },
      { config: {} },
    ];

    expect(resolveCandlePairs(strategies)).toEqual([]);
  });
});
