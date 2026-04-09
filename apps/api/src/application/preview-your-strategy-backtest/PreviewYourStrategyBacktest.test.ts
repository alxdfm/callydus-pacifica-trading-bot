import { describe, expect, it, vi } from "vitest";
import { createPreviewYourStrategyBacktest } from "./PreviewYourStrategyBacktest";

function createDraft() {
  return {
    name: "YOUR Strategy",
    symbol: "BTC/USDC" as const,
    timeframe: "5m" as const,
    indicators: {
      volume: { type: "volume" as const },
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
              indicator: "volume",
              operator: "above" as const,
              value: 100,
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
              indicator: "volume",
              operator: "below" as const,
              value: 50,
            },
          ],
        },
      },
    },
    risk: {
      stopLoss: {
        mode: "static" as const,
        unit: "percent" as const,
        value: 3,
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

function createCandle(closeTime: number, close: number, volume: number) {
  return {
    symbol: "BTC",
    interval: "5m" as const,
    openTime: closeTime - 300_000,
    closeTime,
    open: close,
    high: close + 2,
    low: close - 2,
    close,
    volume,
  };
}

describe("createPreviewYourStrategyBacktest", () => {
  it("retorna not_found quando nao existe strategy salva nem draft inline", async () => {
    const preview = createPreviewYourStrategyBacktest({
      repository: {
        findYourStrategyByWalletAddress: vi.fn().mockResolvedValue(null),
      } as never,
      marketData: {
        getCandles: vi.fn(),
      } as never,
    });

    await expect(
      preview({
        walletAddress: "wallet-1",
        priceSource: "market",
        startTime: 1_000_000,
        endTime: 2_000_000,
        initialCapitalUsd: 1000,
        leverage: 1,
        feePercent: 0,
        slippagePercent: 0,
      }),
    ).resolves.toEqual({
      status: "error",
      code: "strategy_not_found",
      message: "YOUR Strategy was not found for this wallet.",
      retryable: false,
    });
  });

  it("retorna blocker quando a strategy ainda nao e executavel", async () => {
    const preview = createPreviewYourStrategyBacktest({
      repository: {
        findYourStrategyByWalletAddress: vi.fn(),
      } as never,
      marketData: {
        getCandles: vi.fn(),
      } as never,
    });

    await expect(
      preview({
        walletAddress: "wallet-1",
        draft: {
          ...createDraft(),
          risk: {
            ...createDraft().risk,
            takeProfit: null,
          },
        },
        priceSource: "market",
        startTime: 1_000_000,
        endTime: 2_000_000,
        initialCapitalUsd: 1000,
        leverage: 1,
        feePercent: 0,
        slippagePercent: 0,
      }),
    ).resolves.toEqual({
      status: "error",
      code: "strategy_not_executable",
      message: "YOUR Strategy must be executable before running backtest preview.",
      retryable: false,
      activationBlockers: ["take_profit_missing"],
    });
  });

  it("simula backtest usando draft inline sem depender de persistencia previa", async () => {
    const preview = createPreviewYourStrategyBacktest({
      repository: {
        findYourStrategyByWalletAddress: vi.fn(),
      } as never,
      marketData: {
        getCandles: vi.fn().mockResolvedValue([
          createCandle(300_000, 100, 80),
          createCandle(600_000, 102, 90),
          createCandle(900_000, 104, 110),
          createCandle(1_200_000, 105, 150),
          createCandle(1_500_000, 125, 120),
          createCandle(1_800_000, 126, 130),
          createCandle(2_100_000, 127, 140),
        ]),
      } as never,
    });

    const result = await preview({
      walletAddress: "wallet-1",
      draft: createDraft(),
      priceSource: "market",
      startTime: 1_000_000,
      endTime: 2_200_000,
      initialCapitalUsd: 1000,
      leverage: 1,
      feePercent: 0,
      slippagePercent: 0,
    });

    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.strategyId).toBeNull();
      expect(result.symbol).toBe("BTC/USDC");
      expect(result.marketSymbol).toBe("BTC");
      expect(result.timeframe).toBe("5m");
      expect(result.candlesUsed).toBeGreaterThan(0);
    }
  });

  it("expõe indisponibilidade de snapshot sem mascarar como internal_error", async () => {
    const preview = createPreviewYourStrategyBacktest({
      repository: {
        findYourStrategyByWalletAddress: vi.fn(),
      } as never,
      marketData: {
        getCandles: vi.fn().mockRejectedValue(
          new Error("Market candles snapshot is unavailable."),
        ),
      } as never,
    });

    await expect(
      preview({
        walletAddress: "wallet-1",
        draft: createDraft(),
        priceSource: "market",
        startTime: 1_000_000,
        endTime: 2_200_000,
        initialCapitalUsd: 1000,
        leverage: 1,
        feePercent: 0,
        slippagePercent: 0,
      }),
    ).resolves.toEqual({
      status: "error",
      code: "provider_unavailable",
      message: "Market candles snapshot is unavailable.",
      retryable: true,
    });
  });

  it("dispara refresh histórico e tenta de novo quando o snapshot está indisponível", async () => {
    const getCandles = vi
      .fn()
      .mockRejectedValueOnce(new Error("Market candles snapshot is unavailable."))
      .mockResolvedValueOnce([
        createCandle(300_000, 100, 80),
        createCandle(600_000, 102, 90),
        createCandle(900_000, 104, 110),
        createCandle(1_200_000, 105, 150),
        createCandle(1_500_000, 125, 120),
        createCandle(1_800_000, 126, 130),
        createCandle(2_100_000, 127, 140),
      ]);
    const refreshCandles = vi.fn().mockResolvedValue({});
    const preview = createPreviewYourStrategyBacktest({
      repository: {
        findYourStrategyByWalletAddress: vi.fn(),
      } as never,
      marketData: {
        getCandles,
      } as never,
      refresher: {
        refreshCandles,
      },
    });

    const result = await preview({
      walletAddress: "wallet-1",
      draft: createDraft(),
      priceSource: "market",
      startTime: 1_000_000,
      endTime: 2_200_000,
      initialCapitalUsd: 1000,
      leverage: 1,
      feePercent: 0,
      slippagePercent: 0,
    });

    expect(refreshCandles).toHaveBeenCalledTimes(1);
    expect(getCandles).toHaveBeenCalledTimes(2);
    expect(result.status).toBe("success");
  });
});
