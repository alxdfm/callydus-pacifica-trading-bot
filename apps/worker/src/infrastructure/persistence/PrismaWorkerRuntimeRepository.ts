import { PrismaClient } from "@prisma/client";
import type {
  AcquireWorkerLeaseInput,
  AcquiredWorkerLease,
  HeartbeatOwnedRuntimeInput,
  OwnedRuntimeSnapshot,
  ReleaseWorkerLeaseInput,
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
}
