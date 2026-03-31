import type { MarketCandleRequest } from "@pacifica/contracts";
import { PacificaApiError } from "@pacifica/pacifica-market-data";
import {
  buildPresetRiskPlans,
  evaluatePresetSignal,
  getIntervalDurationMs,
  getRequiredPeriod,
  toPacificaMarketSymbol,
} from "@pacifica/preset-engine";
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
  marketData: {
    getCandles(input: MarketCandleRequest): Promise<
      Array<{
        symbol: string;
        interval: MarketCandleRequest["interval"];
        openTime: number;
        closeTime: number;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
      }>
    >;
  };
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
 * - evaluate active presets on the agreed runtime cadence
 * - enqueue deduplicated signal decisions that are ready for order execution
 * - release ownership on pause/deactivation/shutdown
 *
 * Non-responsibility:
 * - it does not submit Pacifica orders yet
 * - it does not manage the full trade lifecycle yet
 */
export function createOperationalWorker(
  dependencies: OperationalWorkerDependencies,
) {
  const logger = dependencies.logger ?? defaultLogger;
  const now = dependencies.now ?? (() => new Date());
  const sleep = dependencies.sleep ?? ((ms: number) =>
    new Promise((resolve) => {
      setTimeout(resolve, ms);
    }));
  const runningLoops = new Map<string, AbortController>();
  let scanAbortController: AbortController | null = null;

  function buildLeaseExpiryIso(reference: Date) {
    return new Date(
      reference.getTime() + dependencies.environment.leaseDurationMs,
    ).toISOString();
  }

  function traceSignal(
    message: string,
    payload?: Record<string, unknown>,
  ) {
    if (!dependencies.environment.signalTraceEnabled) {
      return;
    }

    logger.info(message, payload);
  }

  function shouldEvaluateSignals(
    snapshot: Awaited<
      ReturnType<WorkerRuntimeRepository["readOwnedRuntimeSnapshot"]>
    >,
    tickAt: Date,
  ) {
    const lastEvaluationAt = snapshot?.lastSignalEvaluationAt
      ? new Date(snapshot.lastSignalEvaluationAt)
      : null;

    return (
      lastEvaluationAt === null ||
      tickAt.getTime() - lastEvaluationAt.getTime() >=
        dependencies.environment.analysisIntervalMs
    );
  }

  /**
   * Evaluates the currently active preset and persists a deduplicated
   * operational decision when a signal is present.
   */
  async function evaluateOwnedPreset(
    lease: AcquiredWorkerLease,
    snapshot: NonNullable<
      Awaited<ReturnType<WorkerRuntimeRepository["readOwnedRuntimeSnapshot"]>>
    >,
    tickAt: Date,
  ) {
    if (!snapshot.activePreset) {
      return { signalFingerprint: null as string | null };
    }

    const marketSymbol = toPacificaMarketSymbol(snapshot.activePreset.symbol);

    if (!marketSymbol) {
      throw new Error("Unsupported preset symbol for Pacifica market data.");
    }

    const requiredPeriod = getRequiredPeriod(snapshot.activePreset.effectiveContract);
    const candleLimit = Math.max(120, requiredPeriod * 5);
    const endTime = tickAt.getTime();
    const startTime =
      endTime -
      candleLimit *
        getIntervalDurationMs(snapshot.activePreset.effectiveContract.timeframe);

    traceSignal("worker.signal_trace.fetch_candles_started", {
      operatorAccountId: snapshot.operatorAccountId,
      walletAddress: lease.walletAddress,
      presetActivationId: snapshot.activePreset.id,
      presetDefinitionId: snapshot.activePreset.presetDefinitionId,
      symbol: snapshot.activePreset.symbol,
      marketSymbol,
      timeframe: snapshot.activePreset.effectiveContract.timeframe,
      priceSource: "market",
      startTime,
      endTime,
      candleLimit,
      requiredPeriod,
    });

    const candles = await dependencies.marketData.getCandles({
      symbol: marketSymbol,
      interval: snapshot.activePreset.effectiveContract.timeframe,
      priceSource: "market",
      startTime,
      endTime,
      limit: candleLimit,
    });

    traceSignal("worker.signal_trace.fetch_candles_completed", {
      operatorAccountId: snapshot.operatorAccountId,
      walletAddress: lease.walletAddress,
      presetActivationId: snapshot.activePreset.id,
      candlesReturned: candles.length,
      latestCandleCloseTime:
        candles[candles.length - 1]?.closeTime ?? null,
    });

    if (candles.length < requiredPeriod + 3) {
      throw new Error(
        "Not enough market candles were returned to evaluate the active preset.",
      );
    }

    traceSignal("worker.signal_trace.indicators_started", {
      operatorAccountId: snapshot.operatorAccountId,
      walletAddress: lease.walletAddress,
      presetActivationId: snapshot.activePreset.id,
      indicatorKeys: Object.keys(snapshot.activePreset.effectiveContract.indicators),
    });

    const evaluation = evaluatePresetSignal(
      snapshot.activePreset.effectiveContract,
      candles,
    );

    traceSignal("worker.signal_trace.indicators_completed", {
      operatorAccountId: snapshot.operatorAccountId,
      walletAddress: lease.walletAddress,
      presetActivationId: snapshot.activePreset.id,
      indicatorKeys: Object.keys(evaluation.indicators),
      indicatorCurrents: Object.fromEntries(
        Object.entries(evaluation.indicators).map(([indicatorName, indicatorSnapshot]) => [
          indicatorName,
          indicatorSnapshot.current,
        ]),
      ),
    });

    traceSignal("worker.signal_trace.rules_evaluated", {
      operatorAccountId: snapshot.operatorAccountId,
      walletAddress: lease.walletAddress,
      presetActivationId: snapshot.activePreset.id,
      longSatisfiedCount: evaluation.longRuleEvaluations.filter(
        (rule) => rule.satisfied,
      ).length,
      longRuleCount: evaluation.longRuleEvaluations.length,
      shortSatisfiedCount: evaluation.shortRuleEvaluations.filter(
        (rule) => rule.satisfied,
      ).length,
      shortRuleCount: evaluation.shortRuleEvaluations.length,
      longRuleSummary: evaluation.longRuleEvaluations.map((rule) => ({
        ruleIndex: rule.ruleIndex,
        type: rule.type,
        satisfied: rule.satisfied,
        explanation: rule.explanation,
      })),
      shortRuleSummary: evaluation.shortRuleEvaluations.map((rule) => ({
        ruleIndex: rule.ruleIndex,
        type: rule.type,
        satisfied: rule.satisfied,
        explanation: rule.explanation,
      })),
    });

    traceSignal("worker.signal_trace.signal_decided", {
      operatorAccountId: snapshot.operatorAccountId,
      walletAddress: lease.walletAddress,
      presetActivationId: snapshot.activePreset.id,
      signal: evaluation.signal,
      longSignal: evaluation.longSignal,
      shortSignal: evaluation.shortSignal,
    });

    if (evaluation.signal === "none") {
      return { signalFingerprint: null as string | null };
    }

    const latestCandle = candles[candles.length - 1];

    if (!latestCandle) {
      throw new Error("Latest market candle could not be resolved.");
    }

    const riskPlans = buildPresetRiskPlans(
      snapshot.activePreset.effectiveContract,
      evaluation.indicators,
      latestCandle.close,
    );
    const riskPlan =
      evaluation.signal === "long" ? riskPlans.long : riskPlans.short;
    const signalFingerprint = [
      snapshot.operatorAccountId,
      snapshot.activePreset.id,
      evaluation.signal,
      latestCandle.closeTime,
      "market",
    ].join(":");

    traceSignal("worker.signal_trace.signal_decision_persisting", {
      operatorAccountId: snapshot.operatorAccountId,
      walletAddress: lease.walletAddress,
      presetActivationId: snapshot.activePreset.id,
      signal: evaluation.signal,
      signalFingerprint,
      candleOpenTime: latestCandle.openTime,
      candleCloseTime: latestCandle.closeTime,
      entryReferencePrice: riskPlan.entryPrice,
      stopLossPrice: riskPlan.stopLossPrice,
      takeProfitPrice: riskPlan.takeProfitPrice,
      riskDistance: riskPlan.riskDistance,
    });

    const decisionResult = await dependencies.repository.createSignalDecision({
      operatorAccountId: snapshot.operatorAccountId,
      presetActivationId: snapshot.activePreset.id,
      signalFingerprint,
      signalSide: evaluation.signal,
      symbol: snapshot.activePreset.symbol,
      marketSymbol,
      timeframe: snapshot.activePreset.effectiveContract.timeframe,
      priceSource: "market",
      candleOpenTimeIso: new Date(latestCandle.openTime).toISOString(),
      candleCloseTimeIso: new Date(latestCandle.closeTime).toISOString(),
      entryReferencePrice: riskPlan.entryPrice,
      stopLossPrice: riskPlan.stopLossPrice,
      takeProfitPrice: riskPlan.takeProfitPrice,
      riskDistance: riskPlan.riskDistance,
      payloadJson: {
        presetDefinitionId: snapshot.activePreset.presetDefinitionId,
        signal: evaluation.signal,
        indicators: evaluation.indicators,
        longRuleEvaluations: evaluation.longRuleEvaluations,
        shortRuleEvaluations: evaluation.shortRuleEvaluations,
        latestCandle,
      },
      requestedAtIso: tickAt.toISOString(),
    });

    traceSignal("worker.signal_trace.signal_decision_persisted", {
      operatorAccountId: snapshot.operatorAccountId,
      walletAddress: lease.walletAddress,
      presetActivationId: snapshot.activePreset.id,
      signal: evaluation.signal,
      signalFingerprint,
      decisionStatus: decisionResult.status,
      decisionId: decisionResult.decisionId,
    });

    logger.info("worker.signal_decision_evaluated", {
      operatorAccountId: lease.operatorAccountId,
      walletAddress: lease.walletAddress,
      activePresetActivationId: snapshot.activePreset.id,
      signal: evaluation.signal,
      signalFingerprint,
      decisionStatus: decisionResult.status,
      decisionId: decisionResult.decisionId,
    });

    return {
      signalFingerprint,
    };
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
        let signalFingerprint: string | null | undefined;

        if (shouldEvaluateSignals(snapshot, tickAt)) {
          const evaluationResult = await evaluateOwnedPreset(lease, snapshot, tickAt);
          signalFingerprint = evaluationResult.signalFingerprint;
        }

        const heartbeatApplied = await dependencies.repository.heartbeatOwnedRuntime({
          operatorAccountId: lease.operatorAccountId,
          workerId: dependencies.environment.workerId,
          nowIso: tickAt.toISOString(),
          leaseExpiresAtIso: buildLeaseExpiryIso(tickAt),
          botStatus: "active",
          syncStatus: "healthy",
          pacificaConnectionStatus: "connected",
          lastErrorMessage: null,
          ...(signalFingerprint !== undefined
            ? {
                lastSignalEvaluationAtIso: tickAt.toISOString(),
                lastSignalFingerprint: signalFingerprint,
              }
            : {}),
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
          error instanceof PacificaApiError
            ? extractPacificaErrorMessage(error.details.body, error.message)
            : error instanceof Error
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
        await dependencies.repository.appendOperationalEvent({
          operatorAccountId: lease.operatorAccountId,
          eventType: "signal_evaluation",
          severity: "warning",
          title: "Signal evaluation failed",
          message: errorMessage,
          payloadJson: {
            walletAddress: lease.walletAddress,
          },
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

function extractPacificaErrorMessage(body: unknown, fallback: string): string {
  const apiMessage = (body as { error?: unknown } | null)?.error;

  if (typeof apiMessage === "string" && apiMessage.trim()) {
    return apiMessage;
  }

  const rawMessage = (body as { raw?: unknown } | null)?.raw;

  if (typeof rawMessage === "string" && rawMessage.trim()) {
    return rawMessage;
  }

  return fallback;
}
