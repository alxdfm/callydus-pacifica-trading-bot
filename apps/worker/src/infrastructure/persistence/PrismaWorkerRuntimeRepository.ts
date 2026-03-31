import {
  presetEditableConfigSchema,
  presetTechnicalContractSchema,
} from "@pacifica/contracts";
import { Prisma, PrismaClient } from "@prisma/client";
import type {
  AcquireWorkerLeaseInput,
  AcquiredWorkerLease,
  AppendWorkerOperationalEventInput,
  ClaimSignalDecisionInput,
  CompleteSignalDecisionInput,
  CreateSignalDecisionInput,
  ExecutableSignalDecision,
  FailSignalDecisionInput,
  HeartbeatOwnedRuntimeInput,
  OwnedRuntimeSnapshot,
  PauseRuntimeAfterExecutionFailureInput,
  RecordOrderExecutionAttemptInput,
  ReleaseWorkerLeaseInput,
  SignalDecisionWriteResult,
  StopOwnedRuntimeInput,
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
      include: {
        botRuntimeState: true,
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

      if (runtime?.botStatus === "paused") {
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

      if (runtime?.botStatus === "paused") {
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

function toPrismaInputJsonValue(value: unknown): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  if (value === undefined || value === null) {
    return Prisma.JsonNull;
  }

  return value as Prisma.InputJsonValue;
}

function decimalToNumber(value: Prisma.Decimal) {
  return Number(value.toString());
}
