import { describe, expect, it, vi } from "vitest";
import { createActivePresetMarketDataRequestResolver } from "./ActivePresetMarketDataRequestResolver";

describe("createActivePresetMarketDataRequestResolver", () => {
  it("derives unique market-data requests from active presets", async () => {
    const prisma = {
      botRuntimeState: {
        findMany: vi.fn().mockResolvedValue([
          {
            activePresetActivation: {
              symbol: "SOL/USDC",
              effectiveContractJson: {
                timeframe: "5m",
              },
            },
          },
          {
            activePresetActivation: {
              symbol: "SOL/USDC",
              effectiveContractJson: {
                timeframe: "5m",
              },
            },
          },
          {
            activePresetActivation: {
              symbol: "BTC/USDC",
              effectiveContractJson: {
                timeframe: "15m",
              },
            },
          },
        ]),
      },
    } as never;

    const resolve = createActivePresetMarketDataRequestResolver({
      prisma,
    });

    await expect(resolve()).resolves.toEqual([
      {
        symbol: "BTC",
        interval: "15m",
        priceSource: "market",
        limit: 120,
      },
      {
        symbol: "SOL",
        interval: "5m",
        priceSource: "market",
        limit: 120,
      },
    ]);
  });
});
