import { randomUUID } from "node:crypto";
import type { MarketCandleRequest } from "@pacifica/contracts";
import type { AesCredentialEncryptionService } from "@pacifica/credential-crypto";
import { PacificaApiError } from "@pacifica/pacifica-market-data";
import {
  findMarketInfo,
  normalizeMarketOrderInput,
  PacificaClient,
} from "@pacifica/pacifica-trading";
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
  credentialEncryption: Pick<
    AesCredentialEncryptionService,
    "decryptAgentWalletPrivateKey"
  >;
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

export function buildLeaseExpiryIso(reference: Date, leaseDurationMs: number) {
  return new Date(reference.getTime() + leaseDurationMs).toISOString();
}

export function shouldEvaluateSignals(
  lastSignalEvaluationAt: string | null,
  tickAt: Date,
  analysisIntervalMs: number,
) {
  const lastEvaluationAt = lastSignalEvaluationAt
    ? new Date(lastSignalEvaluationAt)
    : null;

  return (
    lastEvaluationAt === null ||
    tickAt.getTime() - lastEvaluationAt.getTime() >= analysisIntervalMs
  );
}

export function calculateTargetNotionalUsd(input: {
  latestBalanceSnapshot: {
    availableBalance: number;
  } | null;
  positionSizeType: "fixed_amount" | "balance_percent";
  positionSizeValue: number;
}) {
  if (input.positionSizeType === "fixed_amount") {
    return input.positionSizeValue;
  }

  const availableBalance = input.latestBalanceSnapshot?.availableBalance ?? 0;
  return availableBalance * (input.positionSizeValue / 100);
}

export function calculateUnrealizedPnl(input: {
  side: "long" | "short";
  entryPrice: number;
  currentPrice: number;
  quantity: number;
}) {
  const priceDelta =
    input.side === "long"
      ? input.currentPrice - input.entryPrice
      : input.entryPrice - input.currentPrice;

  return priceDelta * input.quantity;
}

export function resolveAutomaticClose(input: {
  side: "long" | "short";
  stopLossPrice: number;
  takeProfitPrice: number;
  candleHigh: number;
  candleLow: number;
}) {
  if (input.side === "long") {
    if (input.candleLow <= input.stopLossPrice) {
      return {
        closeReason: "stop_loss" as const,
        exitPrice: input.stopLossPrice,
      };
    }

    if (input.candleHigh >= input.takeProfitPrice) {
      return {
        closeReason: "take_profit" as const,
        exitPrice: input.takeProfitPrice,
      };
    }

    return null;
  }

  if (input.candleHigh >= input.stopLossPrice) {
    return {
      closeReason: "stop_loss" as const,
      exitPrice: input.stopLossPrice,
    };
  }

  if (input.candleLow <= input.takeProfitPrice) {
    return {
      closeReason: "take_profit" as const,
      exitPrice: input.takeProfitPrice,
    };
  }

  return null;
}

export function formatProtectedPrice(value: number, tickSize: string) {
  const fraction = tickSize.split(".")[1] ?? "";
  const decimals = fraction.length;

  return value.toFixed(decimals);
}

/**
 * Creates the continuous operational worker for active presets.
 *
 * Responsibility:
 * - scan runnable accounts from persisted runtime/preset state
 * - acquire a single-account lease before starting a loop
 * - keep the runtime alive through persisted heartbeats
 * - evaluate active presets on the agreed runtime cadence
 * - enqueue deduplicated signal decisions and execute them as real market orders
 * - keep a local trade lifecycle snapshot with TP/SL-driven closures
 * - release ownership on pause/deactivation/shutdown
 *
 * Non-responsibility:
 * - it does not reconcile local trade state against the Pacifica exchange yet
 * - it does not provide the final exchange-source-of-truth view for the app
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

  function traceSignal(
    message: string,
    payload?: Record<string, unknown>,
  ) {
    if (!dependencies.environment.signalTraceEnabled) {
      return;
    }

    logger.info(message, payload);
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

    const latestCandle = candles[candles.length - 1];

    if (!latestCandle) {
      throw new Error("Latest market candle could not be resolved.");
    }

    await synchronizeOpenTradesWithLatestCandle(
      lease,
      snapshot,
      latestCandle,
    );

    if (evaluation.signal === "none") {
      return { signalFingerprint: null as string | null };
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

  /**
   * Keeps local open trades aligned with the latest evaluated candle and
   * closes them when TP/SL thresholds are crossed.
   */
  async function synchronizeOpenTradesWithLatestCandle(
    lease: AcquiredWorkerLease,
    snapshot: NonNullable<
      Awaited<ReturnType<WorkerRuntimeRepository["readOwnedRuntimeSnapshot"]>>
    >,
    latestCandle: {
      high: number;
      low: number;
      close: number;
      closeTime: number;
    },
  ) {
    if (!snapshot.activePreset) {
      return;
    }

    const openTrades = await dependencies.repository.listOpenTrades(
      snapshot.operatorAccountId,
    );

    for (const trade of openTrades) {
      if (trade.symbol !== snapshot.activePreset.symbol) {
        continue;
      }

      const unrealizedPnl = calculateUnrealizedPnl({
        side: trade.side,
        entryPrice: trade.entryPrice,
        currentPrice: latestCandle.close,
        quantity: trade.quantity,
      });

      await dependencies.repository.updateOpenTradeMarketSnapshot({
        tradeId: trade.tradeId,
        currentPrice: latestCandle.close,
        unrealizedPnl,
        lastSyncedAtIso: new Date(latestCandle.closeTime).toISOString(),
      });

      if (trade.stopLossPrice === null || trade.takeProfitPrice === null) {
        continue;
      }

      const automaticClose = resolveAutomaticClose({
        side: trade.side,
        stopLossPrice: trade.stopLossPrice,
        takeProfitPrice: trade.takeProfitPrice,
        candleHigh: latestCandle.high,
        candleLow: latestCandle.low,
      });

      if (!automaticClose) {
        continue;
      }

      const realizedPnl = calculateUnrealizedPnl({
        side: trade.side,
        entryPrice: trade.entryPrice,
        currentPrice: automaticClose.exitPrice,
        quantity: trade.quantity,
      });

      await dependencies.repository.closeOpenTrade({
        tradeId: trade.tradeId,
        exitPrice: automaticClose.exitPrice,
        realizedPnl,
        closeReason: automaticClose.closeReason,
        closedAtIso: new Date(latestCandle.closeTime).toISOString(),
      });
      await dependencies.repository.appendOperationalEvent({
        operatorAccountId: trade.operatorAccountId,
        eventType: "order_execution",
        severity: "info",
        title:
          automaticClose.closeReason === "take_profit"
            ? "Trade closed by take profit"
            : "Trade closed by stop loss",
        message:
          automaticClose.closeReason === "take_profit"
            ? `${trade.symbol} reached the take-profit threshold.`
            : `${trade.symbol} reached the stop-loss threshold.`,
        payloadJson: {
          tradeId: trade.tradeId,
          symbol: trade.symbol,
          side: trade.side,
          exitPrice: automaticClose.exitPrice,
          closeReason: automaticClose.closeReason,
          walletAddress: lease.walletAddress,
        },
      });
    }
  }

  function classifyOrderExecutionFailure(error: unknown) {
    if (error instanceof PacificaApiError) {
      const status = error.details.status;

      if (status === 429 || error.details.retryable) {
        return {
          retryable: true,
          blocking: false,
          message: extractPacificaErrorMessage(error.details.body, error.message),
          responseBody: error.details.body,
        };
      }

      return {
        retryable: false,
        blocking: true,
        message: extractPacificaErrorMessage(error.details.body, error.message),
        responseBody: error.details.body,
      };
    }

    return {
      retryable: false,
      blocking: true,
      message: error instanceof Error ? error.message : String(error),
      responseBody: null as unknown,
    };
  }

  /**
   * Processes the oldest pending signal decision for the owned account and
   * turns it into one real market-order attempt.
   */
  async function processExecutableSignalDecision(
    lease: AcquiredWorkerLease,
    tickAt: Date,
  ) {
    const signalDecision =
      await dependencies.repository.claimNextExecutableSignalDecision(
        lease.operatorAccountId,
      );

    if (!signalDecision) {
      return;
    }

    if (signalDecision.hasOpenTradeForSymbol) {
      await dependencies.repository.cancelSignalDecision({
        signalDecisionId: signalDecision.signalDecisionId,
      });
      await dependencies.repository.appendOperationalEvent({
        operatorAccountId: signalDecision.operatorAccountId,
        eventType: "order_execution",
        severity: "info",
        title: "Signal skipped because a trade is already open",
        message: `The signal for ${signalDecision.symbol} was ignored because there is already an open position for this symbol.`,
        payloadJson: {
          signalDecisionId: signalDecision.signalDecisionId,
          signalFingerprint: signalDecision.signalFingerprint,
          symbol: signalDecision.symbol,
        },
      });
      traceSignal("worker.execution_trace.signal_cancelled_open_trade_exists", {
        operatorAccountId: signalDecision.operatorAccountId,
        walletAddress: signalDecision.walletAddress,
        signalDecisionId: signalDecision.signalDecisionId,
        signalFingerprint: signalDecision.signalFingerprint,
        symbol: signalDecision.symbol,
      });
      return;
    }

    const clientOrderId = randomUUID();
    const requestedAtIso = tickAt.toISOString();
    const side: "bid" | "ask" =
      signalDecision.signalSide === "long" ? "bid" : "ask";
    const targetNotionalUsd = calculateTargetNotionalUsd({
      latestBalanceSnapshot: signalDecision.latestBalanceSnapshot,
      positionSizeType: signalDecision.activation.positionSizeType,
      positionSizeValue: signalDecision.activation.positionSizeValue,
    });

    traceSignal("worker.execution_trace.execution_started", {
      operatorAccountId: signalDecision.operatorAccountId,
      walletAddress: signalDecision.walletAddress,
      signalDecisionId: signalDecision.signalDecisionId,
      signalFingerprint: signalDecision.signalFingerprint,
      signalSide: signalDecision.signalSide,
      targetNotionalUsd,
    });

    try {
      const decryptedPrivateKey =
        await dependencies.credentialEncryption.decryptAgentWalletPrivateKey({
          encryptedPrivateKeyRef: signalDecision.credential.encryptedPrivateKeyRef,
        });

      const client = new PacificaClient({
        apiBaseUrl: dependencies.environment.pacificaRestBaseUrl,
        account: signalDecision.walletAddress,
        privateKey: decryptedPrivateKey,
        agentWallet: signalDecision.credential.publicKey,
        builderCode: dependencies.environment.pacificaBuilderCode,
        expiryWindowMs: dependencies.environment.pacificaSignatureExpiryWindowMs,
      });
      const marketInfoPayload = await client.getMarketInfo();
      const marketInfo = findMarketInfo(marketInfoPayload, signalDecision.marketSymbol);

      if (!marketInfo) {
        throw new Error("Market info not found for the signal symbol.");
      }

      const normalizedOrder = normalizeMarketOrderInput({
        symbol: signalDecision.marketSymbol,
        referencePrice: signalDecision.entryReferencePrice,
        tickSize: marketInfo.tickSize,
        lotSize: marketInfo.lotSize,
        minOrderSize: marketInfo.minOrderSize,
        targetNotionalUsd,
      });

      const requestPayload = {
        symbol: normalizedOrder.symbol,
        side,
        amount: normalizedOrder.amount,
        slippagePercent: dependencies.environment.marketOrderSlippagePercent,
        clientOrderId,
        takeProfit: {
          stopPrice: formatProtectedPrice(
            signalDecision.takeProfitPrice,
            marketInfo.tickSize,
          ),
          clientOrderId: `${clientOrderId}:tp`,
        },
        stopLoss: {
          stopPrice: formatProtectedPrice(
            signalDecision.stopLossPrice,
            marketInfo.tickSize,
          ),
          clientOrderId: `${clientOrderId}:sl`,
        },
      };

      const response = await client.createMarketOrder(requestPayload);
      const pacificaOrderId =
        (response as { order_id?: unknown } | null)?.order_id !== undefined
          ? String((response as { order_id: unknown }).order_id)
          : null;

      await dependencies.repository.recordOrderExecutionAttempt({
        operatorAccountId: signalDecision.operatorAccountId,
        presetActivationId: signalDecision.presetActivationId,
        signalDecisionId: signalDecision.signalDecisionId,
        clientOrderId,
        signalFingerprint: signalDecision.signalFingerprint,
        symbol: signalDecision.symbol,
        marketSymbol: signalDecision.marketSymbol,
        orderSide: signalDecision.signalSide,
        requestedNotionalUsd: targetNotionalUsd,
        requestedQuantity: Number(normalizedOrder.amount),
        entryReferencePrice: signalDecision.entryReferencePrice,
        slippagePercent: Number(
          dependencies.environment.marketOrderSlippagePercent,
        ),
        requestJson: requestPayload,
        responseJson: response,
        executionStatus: "sent",
        failureReason: null,
        retryableFailure: false,
        pacificaOrderId,
        requestedAtIso,
        finishedAtIso: now().toISOString(),
      });

      try {
        await dependencies.repository.createOpenTradeFromExecution({
          operatorAccountId: signalDecision.operatorAccountId,
          presetActivationId: signalDecision.presetActivationId,
          signalDecisionId: signalDecision.signalDecisionId,
          clientOrderId,
          pacificaOrderId,
          symbol: signalDecision.symbol,
          side: signalDecision.signalSide,
          entryPrice: signalDecision.entryReferencePrice,
          quantity: Number(normalizedOrder.amount),
          capitalAllocated: targetNotionalUsd,
          stopLossPrice: signalDecision.stopLossPrice,
          takeProfitPrice: signalDecision.takeProfitPrice,
          openedAtIso: now().toISOString(),
        });
        await dependencies.repository.completeSignalDecision({
          signalDecisionId: signalDecision.signalDecisionId,
        });
      } catch (persistenceError) {
        const persistenceMessage =
          persistenceError instanceof Error
            ? persistenceError.message
            : "Open trade could not be persisted after successful order submission.";

        await dependencies.repository.appendOperationalEvent({
          operatorAccountId: signalDecision.operatorAccountId,
          eventType: "order_execution",
          severity: "error",
          title: "Trade persistence failed after order submission",
          message: persistenceMessage,
          payloadJson: {
            signalDecisionId: signalDecision.signalDecisionId,
            signalFingerprint: signalDecision.signalFingerprint,
            clientOrderId,
            pacificaOrderId,
          },
        });
        await dependencies.repository.pauseRuntimeAfterExecutionFailure({
          operatorAccountId: signalDecision.operatorAccountId,
          workerId: dependencies.environment.workerId,
          nowIso: now().toISOString(),
          message: persistenceMessage,
        });
        logger.error("worker.trade_lifecycle_persistence_error", {
          operatorAccountId: signalDecision.operatorAccountId,
          walletAddress: signalDecision.walletAddress,
          signalDecisionId: signalDecision.signalDecisionId,
          signalFingerprint: signalDecision.signalFingerprint,
          clientOrderId,
          pacificaOrderId,
          errorMessage: persistenceMessage,
        });
        return;
      }

      await dependencies.repository.appendOperationalEvent({
        operatorAccountId: signalDecision.operatorAccountId,
        eventType: "order_execution",
        severity: "info",
        title: "Market order submitted",
        message: `${signalDecision.signalSide} market order submitted for ${signalDecision.symbol} with stop-loss and take-profit protection.`,
        payloadJson: {
          signalDecisionId: signalDecision.signalDecisionId,
          signalFingerprint: signalDecision.signalFingerprint,
          clientOrderId,
          pacificaOrderId,
          requestPayload,
        },
      });
      logger.info("worker.order_submitted", {
        operatorAccountId: signalDecision.operatorAccountId,
        walletAddress: signalDecision.walletAddress,
        signalDecisionId: signalDecision.signalDecisionId,
        signalFingerprint: signalDecision.signalFingerprint,
        presetActivationId: signalDecision.presetActivationId,
        symbol: signalDecision.symbol,
        marketSymbol: signalDecision.marketSymbol,
        side: signalDecision.signalSide,
        clientOrderId,
        pacificaOrderId,
        requestedNotionalUsd: targetNotionalUsd,
        requestedQuantity: Number(normalizedOrder.amount),
      });
      traceSignal("worker.execution_trace.execution_completed", {
        operatorAccountId: signalDecision.operatorAccountId,
        walletAddress: signalDecision.walletAddress,
        signalDecisionId: signalDecision.signalDecisionId,
        signalFingerprint: signalDecision.signalFingerprint,
        clientOrderId,
        pacificaOrderId,
      });
    } catch (error) {
      const failure = classifyOrderExecutionFailure(error);

      await dependencies.repository.recordOrderExecutionAttempt({
        operatorAccountId: signalDecision.operatorAccountId,
        presetActivationId: signalDecision.presetActivationId,
        signalDecisionId: signalDecision.signalDecisionId,
        clientOrderId,
        signalFingerprint: signalDecision.signalFingerprint,
        symbol: signalDecision.symbol,
        marketSymbol: signalDecision.marketSymbol,
        orderSide: signalDecision.signalSide,
        requestedNotionalUsd: targetNotionalUsd,
        requestedQuantity: 0,
        entryReferencePrice: signalDecision.entryReferencePrice,
        slippagePercent: Number(
          dependencies.environment.marketOrderSlippagePercent,
        ),
        requestJson: {
          signalDecisionId: signalDecision.signalDecisionId,
          signalFingerprint: signalDecision.signalFingerprint,
          marketSymbol: signalDecision.marketSymbol,
          signalSide: signalDecision.signalSide,
        },
        responseJson: failure.responseBody,
        executionStatus: "failed",
        failureReason: failure.message,
        retryableFailure: failure.retryable,
        pacificaOrderId: null,
        requestedAtIso,
        finishedAtIso: now().toISOString(),
      });
      if (failure.retryable && !failure.blocking) {
        await dependencies.repository.requeueSignalDecision({
          signalDecisionId: signalDecision.signalDecisionId,
        });
      } else {
        await dependencies.repository.failSignalDecision({
          signalDecisionId: signalDecision.signalDecisionId,
        });
      }
      await dependencies.repository.appendOperationalEvent({
        operatorAccountId: signalDecision.operatorAccountId,
        eventType: "order_execution",
        severity: failure.blocking ? "error" : "warning",
        title: failure.blocking
          ? "Order execution failed"
          : "Order execution delayed",
        message: failure.message,
        payloadJson: {
          signalDecisionId: signalDecision.signalDecisionId,
          signalFingerprint: signalDecision.signalFingerprint,
          clientOrderId,
          retryable: failure.retryable,
          blocking: failure.blocking,
          responseBody: failure.responseBody,
        },
      });

      if (failure.blocking) {
        await dependencies.repository.pauseRuntimeAfterExecutionFailure({
          operatorAccountId: signalDecision.operatorAccountId,
          workerId: dependencies.environment.workerId,
          nowIso: now().toISOString(),
          message: failure.message,
        });
      }

      logger.error("worker.order_execution_error", {
        operatorAccountId: signalDecision.operatorAccountId,
        walletAddress: signalDecision.walletAddress,
        signalDecisionId: signalDecision.signalDecisionId,
        signalFingerprint: signalDecision.signalFingerprint,
        retryable: failure.retryable,
        blocking: failure.blocking,
        errorMessage: failure.message,
      });
    }
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

        const shouldRunSignalEvaluation = shouldEvaluateSignals(
          snapshot.lastSignalEvaluationAt,
          tickAt,
          dependencies.environment.analysisIntervalMs,
        );
        if (shouldRunSignalEvaluation) {
          const evaluationResult = await evaluateOwnedPreset(
            lease,
            snapshot,
            tickAt,
          );
          signalFingerprint = evaluationResult.signalFingerprint;
        }

        await processExecutableSignalDecision(lease, tickAt);

        const heartbeatApplied = await dependencies.repository.heartbeatOwnedRuntime({
          operatorAccountId: lease.operatorAccountId,
          workerId: dependencies.environment.workerId,
          nowIso: tickAt.toISOString(),
          leaseExpiresAtIso: buildLeaseExpiryIso(
            tickAt,
            dependencies.environment.leaseDurationMs,
          ),
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
          leaseExpiresAtIso: buildLeaseExpiryIso(
            tickAt,
            dependencies.environment.leaseDurationMs,
          ),
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

      logger.info("worker.runtime_candidate_discovered", {
        operatorAccountId: candidate.operatorAccountId,
        walletAddress: candidate.walletAddress,
        activePresetActivationId: candidate.activePresetActivationId,
        workerId: dependencies.environment.workerId,
      });

      const leaseAttemptedAt = now();
      const acquiredLease = await dependencies.repository.tryAcquireWorkerLease({
        operatorAccountId: candidate.operatorAccountId,
        workerId: dependencies.environment.workerId,
        nowIso: leaseAttemptedAt.toISOString(),
        leaseExpiresAtIso: buildLeaseExpiryIso(
          leaseAttemptedAt,
          dependencies.environment.leaseDurationMs,
        ),
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

export function extractPacificaErrorMessage(body: unknown, fallback: string): string {
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
