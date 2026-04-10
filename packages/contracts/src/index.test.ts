import { describe, expect, it } from "vitest";
import { yourStrategyDraftSchema } from "./index";

function createDraft() {
  return {
    name: "YOUR Strategy",
    symbol: "BTC/USDC" as const,
    timeframe: "5m" as const,
    indicators: {
      EMA1: { type: "ema" as const, period: 12 },
      EMA2: { type: "ema" as const, period: 21 },
      RSI1: { type: "rsi" as const, period: 14 },
      VOLUME1: { type: "volume" as const },
      VOLUME_SMA1: {
        type: "sma" as const,
        source: "VOLUME1",
        period: 21,
      },
      ATR_AUTO_14: { type: "atr" as const, period: 14 },
    },
    entry: {
      long: {
        enabled: true,
        trigger: {
          type: "all" as const,
          rules: [
            {
              scope: "currentCandle" as const,
              type: "threshold" as const,
              indicator: "EMA1",
              operator: "above" as const,
              ref: "PRICE",
            },
          ],
        },
      },
      short: {
        enabled: false,
        trigger: {
          type: "all" as const,
          rules: [
            {
              scope: "currentCandle" as const,
              type: "threshold" as const,
              indicator: "EMA1",
              operator: "below" as const,
              ref: "PRICE",
            },
          ],
        },
      },
    },
    risk: {
      stopLoss: {
        mode: "atr" as const,
        period: 14,
        multiplier: 2,
      },
      takeProfit: {
        mode: "rr" as const,
        multiple: 2,
      },
    },
    positionSizeType: "balance_percent" as const,
    positionSizeValue: 5,
  };
}

describe("yourStrategyDraftSchema", () => {
  it("accepts a valid draft within the supported indicator contexts", () => {
    expect(() => yourStrategyDraftSchema.parse(createDraft())).not.toThrow();
  });

  it("rejects drafts with both long and short disabled", () => {
    expect(() =>
      yourStrategyDraftSchema.parse({
        ...createDraft(),
        entry: {
          ...createDraft().entry,
          long: { ...createDraft().entry.long, enabled: false },
          short: { ...createDraft().entry.short, enabled: false },
        },
      }),
    ).toThrow(/At least one entry side must be enabled/);
  });

  it("rejects RSI values outside the 0..100 range", () => {
    expect(() =>
      yourStrategyDraftSchema.parse({
        ...createDraft(),
        entry: {
          ...createDraft().entry,
          long: {
            enabled: true,
            trigger: {
              type: "all",
              rules: [
                {
                  scope: "currentCandle",
                  type: "threshold",
                  indicator: "RSI1",
                  operator: "above",
                  value: 120,
                },
              ],
            },
          },
        },
      }),
    ).toThrow(/RSI values must stay between 0 and 100/);
  });

  it("rejects RSI rules that reference another indicator", () => {
    expect(() =>
      yourStrategyDraftSchema.parse({
        ...createDraft(),
        entry: {
          ...createDraft().entry,
          long: {
            enabled: true,
            trigger: {
              type: "all",
              rules: [
                {
                  scope: "currentCandle",
                  type: "cross",
                  indicator: "RSI1",
                  operator: "crossesAbove",
                  ref: "EMA1",
                },
              ],
            },
          },
        },
      }),
    ).toThrow(/RSI rules must use a numeric level between 0 and 100/);
  });

  it("rejects volume confirmation against non-volume averages", () => {
    expect(() =>
      yourStrategyDraftSchema.parse({
        ...createDraft(),
        entry: {
          ...createDraft().entry,
          long: {
            enabled: true,
            trigger: {
              type: "all",
              rules: [
                {
                  scope: "currentCandle",
                  type: "threshold",
                  indicator: "VOLUME1",
                  operator: "above",
                  ref: "EMA1",
                },
              ],
            },
          },
        },
      }),
    ).toThrow(
      /Volume can only reference a SMA\/EMA derived from the same volume indicator/,
    );
  });

  it("rejects ATR in entry rules", () => {
    expect(() =>
      yourStrategyDraftSchema.parse({
        ...createDraft(),
        entry: {
          ...createDraft().entry,
          long: {
            enabled: true,
            trigger: {
              type: "all",
              rules: [
                {
                  scope: "currentCandle",
                  type: "threshold",
                  indicator: "ATR_AUTO_14",
                  operator: "above",
                  value: 2,
                },
              ],
            },
          },
        },
      }),
    ).toThrow(/ATR can only be used for stop loss/);
  });

  it("rejects price indicators referencing RSI", () => {
    expect(() =>
      yourStrategyDraftSchema.parse({
        ...createDraft(),
        entry: {
          ...createDraft().entry,
          long: {
            enabled: true,
            trigger: {
              type: "all",
              rules: [
                {
                  scope: "currentCandle",
                  type: "threshold",
                  indicator: "EMA1",
                  operator: "above",
                  ref: "RSI1",
                },
              ],
            },
          },
        },
      }),
    ).toThrow(
      /Price indicators can only reference PRICE, EMA or SMA on the price chart/,
    );
  });
});
