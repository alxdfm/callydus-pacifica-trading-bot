import { describe, expect, it, vi } from "vitest";
import {
  YOUR_STRATEGY_PRESET_DEFINITION_ID,
  createYourStrategyDraftFingerprint,
} from "@pacifica/contracts";
import { createActivateYourStrategy } from "./ActivateYourStrategy";

function createStrategy() {
  const draft = {
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

  return {
    id: "a8b53cf7-1377-47c3-b541-e68851d639d7",
    operatorAccountId: "7eb304dd-a080-419f-af56-d90982bc5e6f",
    walletAddress: "wallet-1",
    draft,
    materializedTechnicalContract: {
      name: "YOUR Strategy",
      version: 1,
      timeframe: "5m" as const,
      symbol: "BTC/USDC" as const,
      indicators: draft.indicators,
      entry: draft.entry,
      risk: draft.risk,
      execution: {
        positionSize: {
          type: "fixedPercent" as const,
          value: 5,
        },
        onePositionPerSymbol: true,
        manualCloseAllowed: true,
        closeOppositePositionOnSignal: false,
      },
    },
    activationBlockers: [],
    lastBacktestPreviewedAt: "2026-04-09T00:00:00.000Z",
    lastBacktestPreviewFingerprint: createYourStrategyDraftFingerprint(draft),
    createdAt: "2026-04-09T00:00:00.000Z",
    updatedAt: "2026-04-09T00:00:00.000Z",
  };
}

describe("createActivateYourStrategy", () => {
  it("retorna account_not_ready quando a conta ainda nao esta operacional", async () => {
    const activateYourStrategy = createActivateYourStrategy({
      credentialRepository: {
        findOperationalAccountByWalletAddress: vi.fn().mockResolvedValue({
          onboardingStatus: "pending",
          operationallyVerified: false,
        }),
      } as never,
      yourStrategyRepository: {
        findYourStrategyByWalletAddress: vi.fn(),
      } as never,
      presetActivationRepository: {
        activatePreset: vi.fn(),
      } as never,
    });

    await expect(
      activateYourStrategy({ walletAddress: "wallet-1" }),
    ).resolves.toEqual({
      status: "error",
      code: "account_not_ready",
      message:
        "The account is not operationally ready to activate YOUR Strategy yet.",
      retryable: false,
    });
  });

  it("retorna strategy_not_executable quando ha blockers no draft salvo", async () => {
    const strategy = createStrategy();
    const activateYourStrategy = createActivateYourStrategy({
      credentialRepository: {
        findOperationalAccountByWalletAddress: vi.fn().mockResolvedValue({
          onboardingStatus: "ready",
          operationallyVerified: true,
        }),
      } as never,
      yourStrategyRepository: {
        findYourStrategyByWalletAddress: vi.fn().mockResolvedValue({
          ...strategy,
          materializedTechnicalContract: null,
          activationBlockers: ["take_profit_missing"],
        }),
      } as never,
      presetActivationRepository: {
        activatePreset: vi.fn(),
      } as never,
    });

    await expect(
      activateYourStrategy({ walletAddress: "wallet-1" }),
    ).resolves.toEqual({
      status: "error",
      code: "strategy_not_executable",
      message: "YOUR Strategy must be executable before activation.",
      retryable: false,
      activationBlockers: ["take_profit_missing"],
    });
  });

  it("exige backtest bem-sucedido do draft salvo atual", async () => {
    const strategy = createStrategy();
    const activateYourStrategy = createActivateYourStrategy({
      credentialRepository: {
        findOperationalAccountByWalletAddress: vi.fn().mockResolvedValue({
          onboardingStatus: "ready",
          operationallyVerified: true,
        }),
      } as never,
      yourStrategyRepository: {
        findYourStrategyByWalletAddress: vi.fn().mockResolvedValue({
          ...strategy,
          lastBacktestPreviewFingerprint: null,
        }),
      } as never,
      presetActivationRepository: {
        activatePreset: vi.fn(),
      } as never,
    });

    await expect(
      activateYourStrategy({ walletAddress: "wallet-1" }),
    ).resolves.toEqual({
      status: "error",
      code: "backtest_required",
      message:
        "Run a successful backtest preview for the current YOUR Strategy before activation.",
      retryable: false,
    });
  });

  it("ativa YOUR Strategy no fluxo de preset existente quando o backtest ja cobre o draft atual", async () => {
    const strategy = createStrategy();
    const activatePreset = vi.fn().mockResolvedValue({
      activation: {
        id: "activation-1",
        operatorAccountId: "operator-1",
        presetDefinitionId: YOUR_STRATEGY_PRESET_DEFINITION_ID,
        activationStatus: "active",
        editableConfig: {
          symbol: "BTC/USDC",
          positionSizeType: "balance_percent",
          positionSizeValue: 5,
          longEnabled: true,
          shortEnabled: false,
        },
        activatedAt: "2026-04-09T12:00:00.000Z",
        deactivatedAt: null,
      },
      runtime: {
        botStatus: "inactive",
        pacificaConnectionStatus: "connected",
        syncStatus: "idle",
        exchangeSnapshotStatus: "last_known",
        exchangeLastSyncedAt: null,
        exchangeSnapshotMessage: null,
        activePresetActivationId: "activation-1",
        lastHeartbeatAt: null,
        lastErrorMessage: null,
        symbolOperationalConfigs: [],
      },
    });
    const activateYourStrategy = createActivateYourStrategy({
      credentialRepository: {
        findOperationalAccountByWalletAddress: vi.fn().mockResolvedValue({
          onboardingStatus: "ready",
          operationallyVerified: true,
        }),
      } as never,
      yourStrategyRepository: {
        findYourStrategyByWalletAddress: vi.fn().mockResolvedValue(strategy),
      } as never,
      presetActivationRepository: {
        activatePreset,
      } as never,
      now: () => new Date("2026-04-09T12:00:00.000Z"),
    });

    const result = await activateYourStrategy({ walletAddress: "wallet-1" });

    expect(result.status).toBe("success");
    expect(activatePreset).toHaveBeenCalledWith({
      walletAddress: "wallet-1",
      presetDefinitionId: YOUR_STRATEGY_PRESET_DEFINITION_ID,
      editableConfig: {
        symbol: "BTC/USDC",
        positionSizeType: "balance_percent",
        positionSizeValue: 5,
        longEnabled: true,
        shortEnabled: false,
      },
      effectiveContract: strategy.materializedTechnicalContract,
      requestedBy: "app",
      nowIso: "2026-04-09T12:00:00.000Z",
    });
  });
});
