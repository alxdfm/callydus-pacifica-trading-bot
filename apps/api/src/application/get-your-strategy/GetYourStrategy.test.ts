import { describe, expect, it, vi } from "vitest";
import { createGetYourStrategy } from "./GetYourStrategy";

describe("createGetYourStrategy", () => {
  it("retorna not_found quando a conta ainda não salvou YOUR Strategy", async () => {
    const getYourStrategy = createGetYourStrategy({
      repository: {
        findYourStrategyByWalletAddress: vi.fn().mockResolvedValue(null),
      } as never,
    });

    await expect(
      getYourStrategy({ walletAddress: "wallet-1" }),
    ).resolves.toEqual({
      status: "not_found",
      walletAddress: "wallet-1",
    });
  });

  it("retorna a estratégia persistida quando ela existe", async () => {
    const strategy = {
      id: "5a0f1c8a-65bf-4300-95e5-e7696d08a6ab",
      operatorAccountId: "020a0117-280c-4981-96cb-c675df5035f4",
      walletAddress: "wallet-1",
      draft: {
        name: "YOUR Strategy",
        symbol: "BTC/USDC",
        timeframe: "5m",
        indicators: {
          volume: { type: "volume" },
        },
        entry: {
          long: {
            enabled: true,
            trigger: {
              type: "all",
              rules: [
                {
                  scope: "currentCandle",
                  type: "threshold",
                  indicator: "volume",
                  operator: "above",
                  value: 100,
                },
              ],
            },
          },
          short: {
            enabled: false,
            trigger: {
              type: "all",
              rules: [
                {
                  scope: "currentCandle",
                  type: "threshold",
                  indicator: "volume",
                  operator: "below",
                  value: 50,
                },
              ],
            },
          },
        },
        risk: {
          stopLoss: {
            mode: "static",
            unit: "percent",
            value: 3,
          },
          takeProfit: {
            mode: "rr",
            multiple: 2,
          },
        },
        positionSizeType: "balance_percent",
        positionSizeValue: 5,
      },
      materializedTechnicalContract: null,
      activationBlockers: ["take_profit_missing"],
      createdAt: "2026-04-09T00:00:00.000Z",
      updatedAt: "2026-04-09T00:00:00.000Z",
    } as const;

    const getYourStrategy = createGetYourStrategy({
      repository: {
        findYourStrategyByWalletAddress: vi.fn().mockResolvedValue(strategy),
      } as never,
    });

    await expect(
      getYourStrategy({ walletAddress: "wallet-1" }),
    ).resolves.toEqual({
      status: "found",
      strategy,
    });
  });
});
