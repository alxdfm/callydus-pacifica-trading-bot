import { describe, expect, it, vi } from "vitest";
import type { YourStrategyDraft } from "@pacifica/contracts";
import { createSaveYourStrategy } from "./SaveYourStrategy";

function createDraft(): YourStrategyDraft {
  return {
    name: "YOUR Strategy",
    symbol: "BTC/USDC",
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

describe("createSaveYourStrategy", () => {
  it("materializa o contrato e persiste o draft por wallet", async () => {
    const repository = {
      saveYourStrategy: vi.fn().mockResolvedValue({
        ok: true,
        strategy: {
          id: "cdd13b68-877e-4b22-aad5-68cb494b7d59",
          operatorAccountId: "0bf3c177-a34a-4b76-af26-abde0efc9d82",
          walletAddress: "wallet-1",
          draft: createDraft(),
          materializedTechnicalContract: {
            name: "YOUR Strategy",
            version: 1,
            timeframe: "5m",
            symbol: "BTC/USDC",
            indicators: {
              volume: { type: "volume" },
            },
            entry: createDraft().entry,
            risk: createDraft().risk,
            execution: {
              positionSize: {
                type: "fixedPercent",
                value: 5,
              },
              onePositionPerSymbol: true,
              manualCloseAllowed: true,
              closeOppositePositionOnSignal: false,
            },
          },
          activationBlockers: [],
          createdAt: "2026-04-09T00:00:00.000Z",
          updatedAt: "2026-04-09T00:00:00.000Z",
        },
      }),
    };
    const saveYourStrategy = createSaveYourStrategy({
      repository: repository as never,
    });

    const result = await saveYourStrategy({
      walletAddress: "wallet-1",
      draft: createDraft(),
    });

    expect(result.status).toBe("success");
    expect(repository.saveYourStrategy).toHaveBeenCalledWith({
      walletAddress: "wallet-1",
      draft: createDraft(),
      materializedTechnicalContract: expect.objectContaining({
        symbol: "BTC/USDC",
        timeframe: "5m",
      }),
      activationBlockers: [],
    });
  });

  it("salva draft incompleto com blocker explícito em vez de falhar", async () => {
    const repository = {
      saveYourStrategy: vi.fn().mockResolvedValue({
        ok: true,
        strategy: {
          id: "cdd13b68-877e-4b22-aad5-68cb494b7d59",
          operatorAccountId: "0bf3c177-a34a-4b76-af26-abde0efc9d82",
          walletAddress: "wallet-1",
          draft: {
            ...createDraft(),
            risk: {
              ...createDraft().risk,
              takeProfit: null,
            },
          },
          materializedTechnicalContract: null,
          activationBlockers: ["take_profit_missing"],
          createdAt: "2026-04-09T00:00:00.000Z",
          updatedAt: "2026-04-09T00:00:00.000Z",
        },
      }),
    };
    const saveYourStrategy = createSaveYourStrategy({
      repository: repository as never,
    });

    const result = await saveYourStrategy({
      walletAddress: "wallet-1",
      draft: {
        ...createDraft(),
        risk: {
          ...createDraft().risk,
          takeProfit: null,
        },
      },
    });

    expect(result.status).toBe("success");
    expect(repository.saveYourStrategy).toHaveBeenCalledWith({
      walletAddress: "wallet-1",
      draft: {
        ...createDraft(),
        risk: {
          ...createDraft().risk,
          takeProfit: null,
        },
      },
      materializedTechnicalContract: null,
      activationBlockers: ["take_profit_missing"],
    });
  });

  it("bloqueia edição quando o runtime está ativo", async () => {
    const saveYourStrategy = createSaveYourStrategy({
      repository: {
        saveYourStrategy: vi.fn().mockResolvedValue({
          ok: false,
          code: "editing_blocked_while_bot_running",
        }),
      } as never,
    });

    await expect(
      saveYourStrategy({
        walletAddress: "wallet-1",
        draft: createDraft(),
      }),
    ).resolves.toEqual({
      status: "error",
      code: "editing_blocked_while_bot_running",
      message: "Pause the bot before editing YOUR Strategy.",
      retryable: false,
    });
  });
});
