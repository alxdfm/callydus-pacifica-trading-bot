import type { WorkerEnvironment } from "../infrastructure/config/createWorkerEnvironment";
import type {
  AcquiredWorkerLease,
  WorkerRuntimeRepository,
} from "../domain/WorkerRuntimeRepository";

export type WorkerLogger = {
  info: (message: string, payload?: Record<string, unknown>) => void;
  warn: (message: string, payload?: Record<string, unknown>) => void;
  error: (message: string, payload?: Record<string, unknown>) => void;
};

export type OperationalWorkerDependencies = {
  environment: WorkerEnvironment;
  repository: WorkerRuntimeRepository;
  logger?: WorkerLogger;
  now?: () => Date;
  sleep?: (ms: number) => Promise<void>;
};

const defaultLogger: WorkerLogger = {
  info(message, payload) {
    console.info(message, payload ?? {});
  },
  warn(message, payload) {
    console.warn(message, payload ?? {});
  },
  error(message, payload) {
    console.error(message, payload ?? {});
  },
};

/**
 * Creates the continuous operational worker for active presets.
 *
 * Responsibility:
 * - scan runnable accounts from persisted runtime/preset state
 * - acquire a single-account lease before starting a loop
 * - keep the runtime alive through persisted heartbeats
 * - release ownership on pause/deactivation/shutdown
 *
 * Non-responsibility:
 * - it does not evaluate signals yet
 * - it does not create or close orders yet
 */
export function createOperationalWorker(
  dependencies: OperationalWorkerDependencies,
) {
  const logger = dependencies.logger ?? defaultLogger;
  const now = dependencies.now ?? (() => new Date());
  const sleep = dependencies.sleep ?? ((ms: number) => new Promise((resolve) => {
    setTimeout(resolve, ms);
  }));
  const runningLoops = new Map<string, AbortController>();
  let scanAbortController: AbortController | null = null;

  function buildLeaseExpiryIso(reference: Date) {
    return new Date(
      reference.getTime() + dependencies.environment.leaseDurationMs,
    ).toISOString();
  }

  async function runOwnedAccountLoop(lease: AcquiredWorkerLease, signal: AbortSignal) {
    let nextBackoffMs = dependencies.environment.heartbeatIntervalMs;

    while (!signal.aborted) {
      try {
        const snapshot = await dependencies.repository.readOwnedRuntimeSnapshot(
          lease.operatorAccountId,
          dependencies.environment.workerId,
        );

        if (!snapshot) {
          logger.warn("worker.runtime_ownership_lost", {
            operatorAccountId: lease.operatorAccountId,
            walletAddress: lease.walletAddress,
          });
          return;
        }

        if (!snapshot.activePresetActivationId) {
          await dependencies.repository.stopOwnedRuntime({
            operatorAccountId: lease.operatorAccountId,
            workerId: dependencies.environment.workerId,
            nowIso: now().toISOString(),
            botStatus: "inactive",
            syncStatus: "idle",
            pacificaConnectionStatus: "connected",
            lastErrorMessage: null,
          });
          return;
        }

        if (snapshot.botStatus === "paused") {
          await dependencies.repository.releaseWorkerLease({
            operatorAccountId: lease.operatorAccountId,
            workerId: dependencies.environment.workerId,
          });
          return;
        }

        const tickAt = now();
        const heartbeatApplied = await dependencies.repository.heartbeatOwnedRuntime({
          operatorAccountId: lease.operatorAccountId,
          workerId: dependencies.environment.workerId,
          nowIso: tickAt.toISOString(),
          leaseExpiresAtIso: buildLeaseExpiryIso(tickAt),
          botStatus: "active",
          syncStatus: "healthy",
          pacificaConnectionStatus: "connected",
          lastErrorMessage: null,
        });

        if (!heartbeatApplied) {
          logger.warn("worker.runtime_heartbeat_rejected", {
            operatorAccountId: lease.operatorAccountId,
            walletAddress: lease.walletAddress,
          });
          return;
        }

        nextBackoffMs = dependencies.environment.heartbeatIntervalMs;
        await sleep(dependencies.environment.heartbeatIntervalMs);
      } catch (error) {
        const tickAt = now();
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Worker loop failed with an unknown runtime error.";

        await dependencies.repository.heartbeatOwnedRuntime({
          operatorAccountId: lease.operatorAccountId,
          workerId: dependencies.environment.workerId,
          nowIso: tickAt.toISOString(),
          leaseExpiresAtIso: buildLeaseExpiryIso(tickAt),
          botStatus: "active",
          syncStatus: "degraded",
          pacificaConnectionStatus: "degraded",
          lastErrorMessage: errorMessage,
        });
        logger.error("worker.runtime_loop_error", {
          operatorAccountId: lease.operatorAccountId,
          walletAddress: lease.walletAddress,
          errorMessage,
        });
        await sleep(nextBackoffMs);
        nextBackoffMs = Math.min(
          nextBackoffMs * 2,
          dependencies.environment.maxBackoffMs,
        );
      }
    }
  }

  async function scanOnce() {
    const candidates = await dependencies.repository.listRunnableRuntimeCandidates(
      now().toISOString(),
    );

    for (const candidate of candidates) {
      if (runningLoops.has(candidate.operatorAccountId)) {
        continue;
      }

      const leaseAttemptedAt = now();
      const acquiredLease = await dependencies.repository.tryAcquireWorkerLease({
        operatorAccountId: candidate.operatorAccountId,
        workerId: dependencies.environment.workerId,
        nowIso: leaseAttemptedAt.toISOString(),
        leaseExpiresAtIso: buildLeaseExpiryIso(leaseAttemptedAt),
      });

      if (!acquiredLease) {
        continue;
      }

      logger.info("worker.runtime_lease_acquired", {
        operatorAccountId: acquiredLease.operatorAccountId,
        walletAddress: acquiredLease.walletAddress,
        activePresetActivationId: acquiredLease.activePresetActivationId,
        workerId: dependencies.environment.workerId,
      });

      const accountAbortController = new AbortController();
      runningLoops.set(acquiredLease.operatorAccountId, accountAbortController);

      void runOwnedAccountLoop(acquiredLease, accountAbortController.signal)
        .catch((error) => {
          logger.error("worker.runtime_loop_unhandled_error", {
            operatorAccountId: acquiredLease.operatorAccountId,
            walletAddress: acquiredLease.walletAddress,
            errorMessage: error instanceof Error ? error.message : String(error),
          });
        })
        .finally(async () => {
          runningLoops.delete(acquiredLease.operatorAccountId);
          await dependencies.repository.releaseWorkerLease({
            operatorAccountId: acquiredLease.operatorAccountId,
            workerId: dependencies.environment.workerId,
          });
          logger.info("worker.runtime_lease_released", {
            operatorAccountId: acquiredLease.operatorAccountId,
            walletAddress: acquiredLease.walletAddress,
            workerId: dependencies.environment.workerId,
          });
        });
    }
  }

  /**
   * Starts the continuous scan loop for operational accounts.
   */
  async function start() {
    if (scanAbortController) {
      return;
    }

    scanAbortController = new AbortController();
    logger.info("worker.runtime_started", {
      workerId: dependencies.environment.workerId,
    });

    while (!scanAbortController.signal.aborted) {
      try {
        await scanOnce();
      } catch (error) {
        logger.error("worker.runtime_scan_error", {
          workerId: dependencies.environment.workerId,
          errorMessage: error instanceof Error ? error.message : String(error),
        });
      }

      await sleep(dependencies.environment.scanIntervalMs);
    }
  }

  /**
   * Stops the scan loop and releases every in-flight account lease.
   */
  async function stop() {
    if (!scanAbortController) {
      return;
    }

    scanAbortController.abort();
    scanAbortController = null;

    const runningEntries = Array.from(runningLoops.entries());
    runningLoops.clear();

    await Promise.all(
      runningEntries.map(async ([operatorAccountId, controller]) => {
        controller.abort();
        await dependencies.repository.releaseWorkerLease({
          operatorAccountId,
          workerId: dependencies.environment.workerId,
        });
      }),
    );

    logger.info("worker.runtime_stopped", {
      workerId: dependencies.environment.workerId,
    });
  }

  return {
    start,
    stop,
  };
}
