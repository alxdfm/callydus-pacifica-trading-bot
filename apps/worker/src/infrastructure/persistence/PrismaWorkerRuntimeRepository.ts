import {
  presetEditableConfigSchema,
  presetTechnicalContractSchema,
} from "@pacifica/contracts";
import { Prisma, PrismaClient } from "@prisma/client";
import type {
  AcquireWorkerLeaseInput,
  AcquiredWorkerLease,
  AppendWorkerOperationalEventInput,
  CancelSignalDecisionInput,
  ClaimSignalDecisionInput,
  CloseOpenTradeInput,
  CompleteSignalDecisionInput,
  CreateOpenTradeFromExecutionInput,
  CreateSignalDecisionInput,
  ExecutableSignalDecision,
  FailSignalDecisionInput,
  HeartbeatOwnedRuntimeInput,
  MarkOpenTradeClosingInput,
  OpenTradeLifecycleSnapshot,
  OwnedRuntimeSnapshot,
  PauseRuntimeAfterExecutionFailureInput,
  RequeueSignalDecisionInput,
  RecordOrderExecutionAttemptInput,
  ReleaseWorkerLeaseInput,
  SignalDecisionWriteResult,
  StopOwnedRuntimeInput,
  UpdateOpenTradeMarketSnapshotInput,
  WorkerRuntimeCandidate,
  WorkerRuntimeRepository,
} from "../../domain/WorkerRuntimeRepository";

/**
 * Prisma-backed worker repository for runtime discovery and ownership.
 *
 * Responsibility:
 * - list runnable operator accounts with an active preset
 * - acquire/release a persisted worker lease on `BotRuntimeState`
 * - update runtime heartbeat/state while the current worker owns the lease
 *
 * Non-responsibility:
 * - it does not evaluate signals
 * - it does not create or close orders
 */
export class PrismaWorkerRuntimeRepository implements WorkerRuntimeRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listRunnableRuntimeCandidates(nowIso: string): Promise<WorkerRuntimeCandidate[]> {
    const now = new Date(nowIso);
    const operatorAccounts = await this.prisma.operatorAccount.findMany({
      where: {
        presetActivations: {
          some: {
            activationStatus: "active",
          },
        },
        botRuntimeState: {
          OR: [
            {
              workerOwnerId: null,
            },
            {
              workerLeaseExpiresAt: null,
            },
            {
              workerLeaseExpiresAt: {
                lte: now,
              },
            },
          ],
        },
      },
      include: {
        botRuntimeState: true,
        openTrades: {
          where: {
            closeRequestedAt: {
              not: null,
            },
            closeReasonPending: "manual",
          },
          select: {
            id: true,
          },
        },
        presetActivations: {
          where: {
            activationStatus: "active",
          },
          orderBy: {
            updatedAt: "desc",
          },
          take: 1,
        },
      },
    });

    return operatorAccounts.flatMap((operatorAccount) => {
      const activePreset = operatorAccount.presetActivations[0] ?? null;
      const runtime = operatorAccount.botRuntimeState;
      const workerLeaseExpiresAt = runtime?.workerLeaseExpiresAt ?? null;
      const leaseIsHeldByOtherWorker =
        Boolean(runtime?.workerOwnerId) &&
        workerLeaseExpiresAt !== null &&
        workerLeaseExpiresAt > now;

      if (!activePreset) {
        return [];
      }

      const hasPendingManualClose = operatorAccount.openTrades.length > 0;

      if (
        !runtime ||
        (
          runtime.botStatus !== "active" &&
          runtime.botStatus !== "syncing" &&
          !hasPendingManualClose
        )
      ) {
        return [];
      }

      if (leaseIsHeldByOtherWorker) {
        return [];
      }

      return [
        {
          operatorAccountId: operatorAccount.id,
          walletAddress: operatorAccount.walletAddress,
          activePresetActivationId: activePreset.id,
          hasPendingManualClose,
        },
      ];
    });
  }

  async tryAcquireWorkerLease(
    input: AcquireWorkerLeaseInput,
  ): Promise<AcquiredWorkerLease | null> {
    return this.prisma.$transaction(async (tx) => {
      const operatorAccount = await tx.operatorAccount.findUnique({
        where: {
          id: input.operatorAccountId,
        },
        include: {
          botRuntimeState: true,
          openTrades: {
            where: {
              closeRequestedAt: {
                not: null,
              },
              closeReasonPending: "manual",
            },
            select: {
              id: true,
            },
          },
          presetActivations: {
            where: {
              activationStatus: "active",
            },
            orderBy: {
              updatedAt: "desc",
            },
            take: 1,
          },
        },
      });

      if (!operatorAccount) {
        return null;
      }

      const activePreset = operatorAccount.presetActivations[0] ?? null;
      const runtime = operatorAccount.botRuntimeState;
      const now = new Date(input.nowIso);

      if (!activePreset) {
        return null;
      }

      const hasPendingManualClose = operatorAccount.openTrades.length > 0;

      if (
        !runtime ||
        (
          runtime.botStatus !== "active" &&
          runtime.botStatus !== "syncing" &&
          !hasPendingManualClose
        )
      ) {
        return null;
      }

      const leaseHeldByAnotherWorker =
        runtime?.workerOwnerId &&
        runtime.workerOwnerId !== input.workerId &&
        runtime.workerLeaseExpiresAt !== null &&
        runtime.workerLeaseExpiresAt > now;

      if (leaseHeldByAnotherWorker) {
        return null;
      }

      await tx.botRuntimeState.upsert({
        where: {
          operatorAccountId: operatorAccount.id,
        },
        update: {
          workerOwnerId: input.workerId,
          workerLeaseExpiresAt: new Date(input.leaseExpiresAtIso),
          workerLoopStartedAt:
            runtime?.workerOwnerId === input.workerId && runtime.workerLoopStartedAt
              ? runtime.workerLoopStartedAt
              : now,
          activePresetActivationId: activePreset.id,
        },
        create: {
          operatorAccountId: operatorAccount.id,
          botStatus: "active",
          pacificaConnectionStatus: "connected",
          syncStatus: "idle",
          activePresetActivationId: activePreset.id,
          workerOwnerId: input.workerId,
          workerLeaseExpiresAt: new Date(input.leaseExpiresAtIso),
          workerLoopStartedAt: now,
          lastHeartbeatAt: null,
          lastErrorMessage: null,
        },
      });

      return {
        operatorAccountId: operatorAccount.id,
        walletAddress: operatorAccount.walletAddress,
        activePresetActivationId: activePreset.id,
        hasPendingManualClose,
      };
    });
  }

  async readOwnedRuntimeSnapshot(
    operatorAccountId: string,
    workerId: string,
  ): Promise<OwnedRuntimeSnapshot | null> {
    const operatorAccount = await this.prisma.operatorAccount.findUnique({
      where: {
        id: operatorAccountId,
      },
      include: {
        botRuntimeState: true,
        openTrades: {
          where: {
            closeRequestedAt: {
              not: null,
            },
            closeReasonPending: "manual",
          },
          select: {
            id: true,
          },
        },
        pacificaCredentials: {
          where: {
            validationStatus: "valid",
            lifecycleStatus: "active",
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
        presetActivations: {
          where: {
            activationStatus: "active",
          },
          orderBy: {
            updatedAt: "desc",
          },
          take: 1,
        },
      },
    });

    if (!operatorAccount || operatorAccount.botRuntimeState?.workerOwnerId !== workerId) {
      return null;
    }

    return {
      operatorAccountId: operatorAccount.id,
      walletAddress: operatorAccount.walletAddress,
      activePresetActivationId: operatorAccount.presetActivations[0]?.id ?? null,
      botStatus: operatorAccount.botRuntimeState.botStatus,
      lastSignalEvaluationAt:
        operatorAccount.botRuntimeState.lastSignalEvaluationAt?.toISOString() ?? null,
      hasPendingManualClose: operatorAccount.openTrades.length > 0,
      activeCredential: operatorAccount.pacificaCredentials[0]
        ? {
            publicKey: operatorAccount.pacificaCredentials[0].publicKey,
            encryptedPrivateKeyRef:
              operatorAccount.pacificaCredentials[0].encryptedPrivateKeyRef,
          }
        : null,
      activePreset: operatorAccount.presetActivations[0]
        ? {
            id: operatorAccount.presetActivations[0].id,
            presetDefinitionId: operatorAccount.presetActivations[0].presetDefinitionId,
            symbol: operatorAccount.presetActivations[0].symbol,
            editableConfig: parseEditableConfig(
              operatorAccount.presetActivations[0].editableConfigJson,
            ),
            effectiveContract: parseTechnicalContract(
              operatorAccount.presetActivations[0].effectiveContractJson,
            ),
          }
        : null,
    };
  }

  async heartbeatOwnedRuntime(input: HeartbeatOwnedRuntimeInput): Promise<boolean> {
    const result = await this.prisma.botRuntimeState.updateMany({
      where: {
        operatorAccountId: input.operatorAccountId,
        workerOwnerId: input.workerId,
      },
      data: {
        botStatus: input.botStatus,
        syncStatus: input.syncStatus,
        pacificaConnectionStatus: input.pacificaConnectionStatus,
        workerLeaseExpiresAt: new Date(input.leaseExpiresAtIso),
        lastHeartbeatAt: new Date(input.nowIso),
        ...(input.lastSignalEvaluationAtIso
          ? {
              lastSignalEvaluationAt: new Date(input.lastSignalEvaluationAtIso),
              lastSignalFingerprint: input.lastSignalFingerprint ?? null,
            }
          : {}),
        lastErrorMessage: input.lastErrorMessage,
      },
    });

    return result.count > 0;
  }

  async stopOwnedRuntime(input: StopOwnedRuntimeInput): Promise<void> {
    await this.prisma.botRuntimeState.updateMany({
      where: {
        operatorAccountId: input.operatorAccountId,
        workerOwnerId: input.workerId,
      },
      data: {
        botStatus: input.botStatus,
        syncStatus: input.syncStatus,
        pacificaConnectionStatus: input.pacificaConnectionStatus,
        activePresetActivationId: null,
        workerOwnerId: null,
        workerLeaseExpiresAt: null,
        workerLoopStartedAt: null,
        lastSignalFingerprint: null,
        lastErrorMessage: input.lastErrorMessage,
      },
    });
  }

  async releaseWorkerLease(input: ReleaseWorkerLeaseInput): Promise<void> {
    await this.prisma.botRuntimeState.updateMany({
      where: {
        operatorAccountId: input.operatorAccountId,
        workerOwnerId: input.workerId,
      },
      data: {
        workerOwnerId: null,
        workerLeaseExpiresAt: null,
        workerLoopStartedAt: null,
      },
    });
  }

  async createSignalDecision(
    input: CreateSignalDecisionInput,
  ): Promise<SignalDecisionWriteResult> {
    return this.prisma.$transaction(async (tx) => {
      const duplicate = await tx.signalDecision.findFirst({
        where: {
          operatorAccountId: input.operatorAccountId,
          signalFingerprint: input.signalFingerprint,
          decisionStatus: {
            in: ["pending", "processing"],
          },
        },
        orderBy: {
          requestedAt: "desc",
        },
      });

      if (duplicate) {
        return {
          status: "duplicate",
          decisionId: duplicate.id,
        };
      }

      const decision = await tx.signalDecision.create({
        data: {
          operatorAccountId: input.operatorAccountId,
          presetActivationId: input.presetActivationId,
          signalFingerprint: input.signalFingerprint,
          decisionStatus: "pending",
          signalSide: input.signalSide,
          symbol: input.symbol,
          marketSymbol: input.marketSymbol,
          timeframe: input.timeframe,
          priceSource: input.priceSource,
          candleOpenTime: new Date(input.candleOpenTimeIso),
          candleCloseTime: new Date(input.candleCloseTimeIso),
          entryReferencePrice: new Prisma.Decimal(input.entryReferencePrice),
          stopLossPrice: new Prisma.Decimal(input.stopLossPrice),
          takeProfitPrice: new Prisma.Decimal(input.takeProfitPrice),
          riskDistance: new Prisma.Decimal(input.riskDistance),
          payloadJson: toPrismaInputJsonValue(input.payloadJson),
          requestedAt: new Date(input.requestedAtIso),
        },
      });

      await tx.operationalEvent.create({
        data: {
          operatorAccountId: input.operatorAccountId,
          eventType: "signal_evaluation",
          severity: "info",
          title: "Signal decision queued",
          message: `${input.signalSide} decision queued for ${input.symbol}.`,
          payloadJson: toPrismaInputJsonValue({
            signalDecisionId: decision.id,
            signalFingerprint: input.signalFingerprint,
            signalSide: input.signalSide,
            marketSymbol: input.marketSymbol,
            timeframe: input.timeframe,
            priceSource: input.priceSource,
          }),
        },
      });

      return {
        status: "created",
        decisionId: decision.id,
      };
    });
  }

  async appendOperationalEvent(
    input: AppendWorkerOperationalEventInput,
  ): Promise<void> {
    await this.prisma.operationalEvent.create({
      data: {
        operatorAccountId: input.operatorAccountId,
        eventType: input.eventType,
        severity: input.severity,
        title: input.title,
        message: input.message,
        payloadJson: toPrismaInputJsonValue(input.payloadJson),
      },
    });
  }

  async claimNextExecutableSignalDecision(
    operatorAccountId: string,
  ): Promise<ExecutableSignalDecision | null> {
    return this.prisma.$transaction(async (tx) => {
      const decision = await tx.signalDecision.findFirst({
        where: {
          operatorAccountId,
          decisionStatus: "pending",
        },
        orderBy: {
          requestedAt: "asc",
        },
        include: {
          operatorAccount: {
            include: {
              accountBalanceSnapshots: {
                orderBy: {
                  capturedAt: "desc",
                },
                take: 1,
              },
              botRuntimeState: true,
              symbolOperationalConfigs: {
                orderBy: {
                  symbol: "asc",
                },
              },
              pacificaCredentials: {
                where: {
                  lifecycleStatus: "active",
                },
                orderBy: {
                  updatedAt: "desc",
                },
                take: 1,
              },
            },
          },
          presetActivation: true,
        },
      });

      if (!decision) {
        return null;
      }

      const updated = await tx.signalDecision.updateMany({
        where: {
          id: decision.id,
          decisionStatus: "pending",
        },
        data: {
          decisionStatus: "processing",
        },
      });

      if (updated.count === 0) {
        return null;
      }

      const credential = decision.operatorAccount.pacificaCredentials[0];

      if (!credential) {
        throw new Error("No active Pacifica credential is available for execution.");
      }

      const balanceSnapshot = decision.operatorAccount.accountBalanceSnapshots[0] ?? null;
      const existingOpenTrade = await tx.openTrade.findFirst({
        where: {
          operatorAccountId,
          symbol: decision.symbol,
        },
        select: {
          id: true,
        },
      });

      return {
        signalDecisionId: decision.id,
        operatorAccountId: decision.operatorAccountId,
        walletAddress: decision.operatorAccount.walletAddress,
        presetActivationId: decision.presetActivationId,
        signalFingerprint: decision.signalFingerprint,
        signalSide: decision.signalSide,
        symbol: decision.symbol,
        marketSymbol: decision.marketSymbol,
        entryReferencePrice: decimalToNumber(decision.entryReferencePrice),
        stopLossPrice: decimalToNumber(decision.stopLossPrice),
        takeProfitPrice: decimalToNumber(decision.takeProfitPrice),
        riskDistance: decimalToNumber(decision.riskDistance),
        requestedAt: decision.requestedAt.toISOString(),
        credential: {
          publicKey: credential.publicKey,
          encryptedPrivateKeyRef: credential.encryptedPrivateKeyRef,
        },
        activation: {
          positionSizeType: decision.presetActivation.positionSizeType,
          positionSizeValue: decimalToNumber(decision.presetActivation.positionSizeValue),
          leverage: parseSymbolOperationalLeverage(
            decision.operatorAccount.symbolOperationalConfigs,
            decision.presetActivation.symbol,
          ),
          symbol: decision.presetActivation.symbol,
          effectiveContract: parseTechnicalContract(
            decision.presetActivation.effectiveContractJson,
          ),
        },
        latestBalanceSnapshot: balanceSnapshot
          ? {
              availableBalance: decimalToNumber(balanceSnapshot.availableBalance),
              totalBalance: decimalToNumber(balanceSnapshot.totalBalance),
              capitalInUse: decimalToNumber(balanceSnapshot.capitalInUse),
              capturedAt: balanceSnapshot.capturedAt.toISOString(),
            }
          : null,
        hasOpenTradeForSymbol: existingOpenTrade !== null,
      };
    });
  }

  async recordOrderExecutionAttempt(
    input: RecordOrderExecutionAttemptInput,
  ): Promise<void> {
    await this.prisma.orderExecutionAttempt.create({
      data: {
        operatorAccountId: input.operatorAccountId,
        presetActivationId: input.presetActivationId,
        signalDecisionId: input.signalDecisionId,
        executionStatus: input.executionStatus,
        clientOrderId: input.clientOrderId,
        signalFingerprint: input.signalFingerprint,
        symbol: input.symbol,
        marketSymbol: input.marketSymbol,
        orderSide: input.orderSide,
        requestedNotionalUsd: new Prisma.Decimal(input.requestedNotionalUsd),
        requestedQuantity: new Prisma.Decimal(input.requestedQuantity),
        entryReferencePrice: new Prisma.Decimal(input.entryReferencePrice),
        slippagePercent: new Prisma.Decimal(input.slippagePercent),
        requestJson: toPrismaInputJsonValue(input.requestJson),
        responseJson: toPrismaInputJsonValue(input.responseJson),
        failureReason: input.failureReason,
        retryableFailure: input.retryableFailure,
        pacificaOrderId: input.pacificaOrderId,
        requestedAt: new Date(input.requestedAtIso),
        finishedAt: input.finishedAtIso ? new Date(input.finishedAtIso) : null,
      },
    });
  }

  async failSignalDecision(input: FailSignalDecisionInput): Promise<void> {
    await this.prisma.signalDecision.update({
      where: {
        id: input.signalDecisionId,
      },
      data: {
        decisionStatus: "failed",
      },
    });
  }

  async requeueSignalDecision(input: RequeueSignalDecisionInput): Promise<void> {
    await this.prisma.signalDecision.update({
      where: {
        id: input.signalDecisionId,
      },
      data: {
        decisionStatus: "pending",
      },
    });
  }

  async completeSignalDecision(input: CompleteSignalDecisionInput): Promise<void> {
    await this.prisma.signalDecision.update({
      where: {
        id: input.signalDecisionId,
      },
      data: {
        decisionStatus: "completed",
      },
    });
  }

  async cancelSignalDecision(input: CancelSignalDecisionInput): Promise<void> {
    await this.prisma.signalDecision.update({
      where: {
        id: input.signalDecisionId,
      },
      data: {
        decisionStatus: "cancelled",
      },
    });
  }

  async createOpenTradeFromExecution(
    input: CreateOpenTradeFromExecutionInput,
  ): Promise<void> {
    await this.prisma.openTrade.create({
      data: {
        operatorAccountId: input.operatorAccountId,
        pacificaTradeId: input.pacificaOrderId ?? input.clientOrderId,
        presetActivationId: input.presetActivationId,
        stopLossPrice: new Prisma.Decimal(input.stopLossPrice),
        takeProfitPrice: new Prisma.Decimal(input.takeProfitPrice),
        entryClientOrderId: input.clientOrderId,
        pacificaOrderId: input.pacificaOrderId,
        symbol: input.symbol,
        side: input.side,
        entryPrice: new Prisma.Decimal(input.entryPrice),
        currentPrice: new Prisma.Decimal(input.entryPrice),
        quantity: new Prisma.Decimal(input.quantity),
        capitalAllocated: new Prisma.Decimal(input.capitalAllocated),
        unrealizedPnl: new Prisma.Decimal(0),
        tradeStatus: "open",
        openedAt: new Date(input.openedAtIso),
        closeRequestedAt: null,
        closeReasonPending: null,
        isPlatformTrade: true,
        lastSyncedAt: new Date(input.openedAtIso),
      },
    });
  }

  async listOpenTrades(
    operatorAccountId: string,
  ): Promise<OpenTradeLifecycleSnapshot[]> {
    const trades = await this.prisma.openTrade.findMany({
      where: {
        operatorAccountId,
      },
      orderBy: {
        openedAt: "asc",
      },
    });

    return trades.map((trade) => ({
      tradeId: trade.id,
      operatorAccountId: trade.operatorAccountId,
      symbol: trade.symbol,
      side: trade.side,
      entryPrice: decimalToNumber(trade.entryPrice),
      quantity: decimalToNumber(trade.quantity),
      capitalAllocated: decimalToNumber(trade.capitalAllocated),
      stopLossPrice: trade.stopLossPrice
        ? decimalToNumber(trade.stopLossPrice)
        : null,
      takeProfitPrice: trade.takeProfitPrice
        ? decimalToNumber(trade.takeProfitPrice)
        : null,
      currentPrice: decimalToNumber(trade.currentPrice),
      openedAt: trade.openedAt.toISOString(),
      presetActivationId: trade.presetActivationId,
      pacificaTradeId: trade.pacificaTradeId,
      isPlatformTrade: trade.isPlatformTrade,
      closeRequestedAt: trade.closeRequestedAt?.toISOString() ?? null,
      closeReasonPending: trade.closeReasonPending,
    }));
  }

  async updateOpenTradeMarketSnapshot(
    input: UpdateOpenTradeMarketSnapshotInput,
  ): Promise<void> {
    await this.prisma.openTrade.update({
      where: {
        id: input.tradeId,
      },
      data: {
        currentPrice: new Prisma.Decimal(input.currentPrice),
        unrealizedPnl: new Prisma.Decimal(input.unrealizedPnl),
        lastSyncedAt: new Date(input.lastSyncedAtIso),
      },
    });
  }

  async closeOpenTrade(input: CloseOpenTradeInput): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const trade = await tx.openTrade.findUnique({
        where: {
          id: input.tradeId,
        },
      });

      if (!trade) {
        return;
      }

      await tx.closedTrade.create({
        data: {
          operatorAccountId: trade.operatorAccountId,
          pacificaTradeId: trade.pacificaTradeId,
          presetActivationId: trade.presetActivationId,
          symbol: trade.symbol,
          side: trade.side,
          entryPrice: trade.entryPrice,
          exitPrice: new Prisma.Decimal(input.exitPrice),
          quantity: trade.quantity,
          capitalAllocated: trade.capitalAllocated,
          realizedPnl: new Prisma.Decimal(input.realizedPnl),
          closeReason: input.closeReason,
          openedAt: trade.openedAt,
          closedAt: new Date(input.closedAtIso),
          isPlatformTrade: trade.isPlatformTrade,
          closedByCommandId: null,
          lastSyncedAt: new Date(input.closedAtIso),
        },
      });

      await tx.openTrade.delete({
        where: {
          id: trade.id,
        },
      });
    });
  }

  async markOpenTradeClosing(input: MarkOpenTradeClosingInput): Promise<void> {
    await this.prisma.openTrade.update({
      where: {
        id: input.tradeId,
      },
      data: {
        tradeStatus: input.tradeStatus ?? "close_requested",
        closeRequestedAt: new Date(input.closeRequestedAtIso),
        closeReasonPending: input.closeReasonPending,
      },
    });
  }

  async pauseRuntimeAfterExecutionFailure(
    input: PauseRuntimeAfterExecutionFailureInput,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.botRuntimeState.updateMany({
        where: {
          operatorAccountId: input.operatorAccountId,
          workerOwnerId: input.workerId,
        },
        data: {
          botStatus: "paused",
          syncStatus: "degraded",
          pacificaConnectionStatus: "degraded",
          lastErrorMessage: input.message,
          workerOwnerId: null,
          workerLeaseExpiresAt: null,
          workerLoopStartedAt: null,
        },
      });

      await tx.operationalAlert.create({
        data: {
          operatorAccountId: input.operatorAccountId,
          alertType: "command",
          severity: "error",
          title: "Order execution failed",
          message: input.message,
          isActive: true,
        },
      });
    });
  }
}

function parseEditableConfig(value: Prisma.JsonValue | null) {
  return presetEditableConfigSchema.parse(value);
}

function parseTechnicalContract(value: Prisma.JsonValue) {
  return presetTechnicalContractSchema.parse(value);
}

function parseSymbolOperationalLeverage(
  value: Array<{ symbol: string; leverage: Prisma.Decimal }>,
  symbol: string,
) {
  const match = value.find((item) => item.symbol.trim() === symbol);

  if (!match) {
    return null;
  }

  const leverage = Number(match.leverage.toString());
  return Number.isFinite(leverage) && leverage > 0 ? leverage : null;
}

function toPrismaInputJsonValue(value: unknown): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  if (value === undefined || value === null) {
    return Prisma.JsonNull;
  }

  return value as Prisma.InputJsonValue;
}

function decimalToNumber(value: Prisma.Decimal) {
  return Number(value.toString());
}
