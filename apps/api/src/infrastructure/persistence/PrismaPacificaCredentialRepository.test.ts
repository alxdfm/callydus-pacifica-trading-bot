import { describe, expect, it, vi } from "vitest";
import {
  inferPacificaCloseReason,
  PrismaPacificaCredentialRepository,
} from "./PrismaPacificaCredentialRepository";

function createDraft() {
  return {
    name: "YOUR Strategy",
    symbol: "BTC/USDC" as const,
    timeframe: "5m" as const,
    indicators: {
      EMA1: { type: "ema" as const, period: 12 },
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

function createMaterializedContract() {
  return {
    name: "YOUR Strategy",
    version: 1,
    timeframe: "5m" as const,
    symbol: "BTC/USDC" as const,
    indicators: {
      EMA1: { type: "ema" as const, period: 12 },
    },
    entry: createDraft().entry,
    risk: createDraft().risk,
    execution: {
      positionSize: {
        type: "fixedPercent" as const,
        value: 5,
      },
      onePositionPerSymbol: true,
      manualCloseAllowed: true,
      closeOppositePositionOnSignal: false,
    },
  };
}

function createStrategyRow(input: {
  operatorAccountId: string;
  walletAddress: string;
}) {
  return {
    id: "5f0f0cd2-e1f0-4a96-bbf0-8e4bdc523901",
    operatorAccountId: input.operatorAccountId,
    draftJson: createDraft(),
    materializedContractJson: createMaterializedContract(),
    activationBlockersJson: [],
    lastBacktestPreviewedAt: null,
    lastBacktestPreviewFingerprint: null,
    createdAt: new Date("2026-04-10T00:00:00.000Z"),
    updatedAt: new Date("2026-04-10T00:00:00.000Z"),
    operatorAccount: {
      walletAddress: input.walletAddress,
    },
  };
}

describe("PrismaPacificaCredentialRepository - YOUR Strategy", () => {
  it("persiste YOUR Strategy isolada por operatorAccountId", async () => {
    const upsert = vi.fn().mockImplementation(({ where }) =>
      Promise.resolve(
        createStrategyRow({
          operatorAccountId: where.operatorAccountId,
          walletAddress:
            where.operatorAccountId ===
            "11111111-1111-4111-8111-111111111111"
              ? "wallet-1"
              : "wallet-2",
        }),
      ),
    );
    const tx = {
      operatorAccount: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce({
            id: "11111111-1111-4111-8111-111111111111",
            walletAddress: "wallet-1",
            botRuntimeState: null,
          })
          .mockResolvedValueOnce({
            id: "22222222-2222-4222-8222-222222222222",
            walletAddress: "wallet-2",
            botRuntimeState: null,
          }),
      },
      yourStrategy: {
        upsert,
      },
    };
    const prisma: any = {
      $transaction: vi.fn().mockImplementation((callback) => callback(tx)),
    };

    const repository = new PrismaPacificaCredentialRepository(prisma);

    await repository.saveYourStrategy({
      walletAddress: "wallet-1",
      draft: createDraft(),
      materializedTechnicalContract: createMaterializedContract(),
      activationBlockers: [],
    });
    await repository.saveYourStrategy({
      walletAddress: "wallet-2",
      draft: createDraft(),
      materializedTechnicalContract: createMaterializedContract(),
      activationBlockers: [],
    });

    expect(upsert).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: { operatorAccountId: "11111111-1111-4111-8111-111111111111" },
      }),
    );
    expect(upsert).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: { operatorAccountId: "22222222-2222-4222-8222-222222222222" },
      }),
    );
  });

  it("retorna a strategy persistida filtrando por walletAddress da conta", async () => {
    const prisma: any = {
      yourStrategy: {
        findFirst: vi.fn().mockResolvedValue(
          createStrategyRow({
            operatorAccountId: "11111111-1111-4111-8111-111111111111",
            walletAddress: "wallet-1",
          }),
        ),
      },
    };

    const repository = new PrismaPacificaCredentialRepository(prisma);
    const strategy = await repository.findYourStrategyByWalletAddress("wallet-1");

    expect(prisma.yourStrategy.findFirst).toHaveBeenCalledWith({
      where: {
        operatorAccount: {
          walletAddress: "wallet-1",
        },
      },
      include: {
        operatorAccount: true,
      },
    });
    expect(strategy?.walletAddress).toBe("wallet-1");
    expect(strategy?.operatorAccountId).toBe(
      "11111111-1111-4111-8111-111111111111",
    );
  });
});

describe("inferPacificaCloseReason", () => {
  it("prioriza o campo cause da Pacifica para take profit e stop loss", () => {
    expect(
      inferPacificaCloseReason({
        cause: "take_profit",
        clientOrderId: null,
      }),
    ).toBe("take_profit");

    expect(
      inferPacificaCloseReason({
        cause: "stop loss",
        clientOrderId: null,
      }),
    ).toBe("stop_loss");
  });

  it("mantem compatibilidade com clientOrderId legado quando necessario", () => {
    expect(
      inferPacificaCloseReason({
        cause: null,
        clientOrderId: "order-1:tp",
      }),
    ).toBe("take_profit");

    expect(
      inferPacificaCloseReason({
        cause: null,
        clientOrderId: "order-1:sl",
      }),
    ).toBe("stop_loss");
  });

  it("faz fallback para system quando nao ha evidencia suficiente", () => {
    expect(
      inferPacificaCloseReason({
        cause: null,
        clientOrderId: "order-1",
      }),
    ).toBe("system");
  });
});
