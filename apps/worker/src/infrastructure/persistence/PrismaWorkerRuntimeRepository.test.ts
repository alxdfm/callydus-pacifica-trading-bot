import { describe, expect, it, vi } from "vitest";
import { PrismaWorkerRuntimeRepository } from "./PrismaWorkerRuntimeRepository";

function createTechnicalContract() {
  return {
    name: "YOUR Strategy",
    version: 1,
    timeframe: "5m" as const,
    symbol: "SOL/USDC" as const,
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
              ref: "PRICE" as const,
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
              ref: "PRICE" as const,
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

function createSignalDecisionInput() {
  return {
    operatorAccountId: "op-1",
    presetActivationId: "act-1",
    signalFingerprint: "op-1:act-1:long:123:market",
    signalSide: "long" as const,
    symbol: "SOL/USDC",
    marketSymbol: "SOL",
    timeframe: "5m",
    priceSource: "market",
    candleOpenTimeIso: "2026-04-11T15:00:00.000Z",
    candleCloseTimeIso: "2026-04-11T15:05:00.000Z",
    entryReferencePrice: 84.35,
    stopLossPrice: 84.24,
    takeProfitPrice: 84.57,
    riskDistance: 0.11,
    payloadJson: {},
    requestedAtIso: "2026-04-11T15:05:00.000Z",
  };
}

describe("PrismaWorkerRuntimeRepository", () => {
  it("nao cria nova signal decision quando ja existe open trade para o simbolo", async () => {
    const tx = {
      openTrade: {
        findFirst: vi.fn().mockResolvedValue({ id: "trade-1" }),
      },
      signalDecision: {
        findFirst: vi.fn(),
      },
      operationalEvent: {
        create: vi.fn(),
      },
    };
    const prisma: any = {
      $transaction: vi.fn().mockImplementation((callback) => callback(tx)),
    };

    const repository = new PrismaWorkerRuntimeRepository(prisma);
    const result = await repository.createSignalDecision(createSignalDecisionInput());

    expect(result).toEqual({
      status: "skipped_open_trade",
      decisionId: null,
    });
    expect(tx.signalDecision.findFirst).not.toHaveBeenCalled();
    expect(tx.operationalEvent.create).not.toHaveBeenCalled();
  });

  it("nao cria nova signal decision quando ja existe decision pendente para o simbolo", async () => {
    const tx = {
      openTrade: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
      signalDecision: {
        findFirst: vi.fn().mockResolvedValue({
          id: "decision-existing",
        }),
      },
      operationalEvent: {
        create: vi.fn(),
      },
    };
    const prisma: any = {
      $transaction: vi.fn().mockImplementation((callback) => callback(tx)),
    };

    const repository = new PrismaWorkerRuntimeRepository(prisma);
    const result = await repository.createSignalDecision(createSignalDecisionInput());

    expect(result).toEqual({
      status: "skipped_pending_decision",
      decisionId: "decision-existing",
    });
    expect(tx.operationalEvent.create).not.toHaveBeenCalled();
  });

  it("reconhece open trade existente quando o decision usa marketSymbol Pacifica e o trade local usa symbol do produto", async () => {
    const tx = {
      signalDecision: {
        findFirst: vi.fn().mockResolvedValue({
          id: "decision-1",
          operatorAccountId: "op-1",
          presetActivationId: "act-1",
          signalFingerprint: "op-1:act-1:long:123:market",
          signalSide: "long",
          symbol: "SOL/USDC",
          marketSymbol: "SOL",
          entryReferencePrice: { toString: () => "84.35" },
          stopLossPrice: { toString: () => "84.24" },
          takeProfitPrice: { toString: () => "84.57" },
          riskDistance: { toString: () => "0.11" },
          requestedAt: new Date("2026-04-11T15:05:00.000Z"),
          operatorAccount: {
            walletAddress: "wallet-1",
            pacificaCredentials: [
              {
                publicKey: "agent-wallet",
                encryptedPrivateKeyRef: "ref-1",
              },
            ],
            accountBalanceSnapshots: [
              {
                availableBalance: { toString: () => "100" },
                totalBalance: { toString: () => "120" },
                capitalInUse: { toString: () => "20" },
                capturedAt: new Date("2026-04-11T15:00:00.000Z"),
              },
            ],
            symbolOperationalConfigs: [
              {
                symbol: "SOL/USDC",
                leverage: { toString: () => "1" },
              },
            ],
          },
          presetActivation: {
            positionSizeType: "balance_percent",
            positionSizeValue: { toString: () => "5" },
            symbol: "SOL/USDC",
            effectiveContractJson: createTechnicalContract(),
          },
        }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      openTrade: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "trade-1",
            symbol: "SOL/USDC",
          },
        ]),
      },
    };
    const prisma: any = {
      $transaction: vi.fn().mockImplementation((callback) => callback(tx)),
    };

    const repository = new PrismaWorkerRuntimeRepository(prisma);
    const result = await repository.claimNextExecutableSignalDecision("op-1");

    expect(result?.hasOpenTradeForSymbol).toBe(true);
    expect(result?.marketSymbol).toBe("SOL");
    expect(result?.symbol).toBe("SOL/USDC");
  });
});
